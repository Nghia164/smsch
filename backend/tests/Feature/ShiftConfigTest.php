<?php

namespace Tests\Feature;

use App\Models\CaMau;
use App\Models\RangBuoc;
use Database\Seeders\CaMauSeeder;
use Database\Seeders\NhanVienSeeder;
use Database\Seeders\RangBuocSeeder;
use Database\Seeders\RoleTagSeeder;
use Database\Seeders\TaiKhoanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShiftConfigTest extends TestCase
{
    use RefreshDatabase;

    protected string $managerToken;
    protected string $staffToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleTagSeeder::class);
        $this->seed(TaiKhoanSeeder::class);
        $this->seed(NhanVienSeeder::class);
        $this->seed(CaMauSeeder::class);
        $this->seed(RangBuocSeeder::class);

        // Đăng nhập Manager
        $mgrLogin = $this->postJson('/api/auth/login', [
            'email'    => 'manager@example.com',
            'password' => 'Password@123',
        ]);
        $this->managerToken = $mgrLogin->json('token');

        // Đăng nhập Staff
        $staffLogin = $this->postJson('/api/auth/login', [
            'email'    => 'nhanvien1@example.com',
            'password' => 'Password@123',
        ]);
        $this->staffToken = $staffLogin->json('token');
    }

    public function test_get_shift_config_returns_all_three_sections()
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->managerToken)
            ->getJson('/api/shift-config');

        $res->assertStatus(200);
        $res->assertJsonStructure([
            'status',
            'shifts'          => [['id', 'name', 'startTime', 'endTime', 'multiplier', 'status']],
            'constraints'     => [['id', 'name', 'category', 'enabled']],
            'generalSettings' => ['availabilityDeadlineDay', 'availabilityDeadlineTime', 'gracePeriodMin', 'holidayMultiplier', 'holidays'],
            'data'            => ['shifts', 'constraints', 'generalSettings'],
        ]);

        $this->assertNotEmpty($res->json('shifts'));
        $this->assertNotEmpty($res->json('constraints'));
        $this->assertEquals(5, $res->json('generalSettings.gracePeriodMin'));
    }

    public function test_unauthenticated_and_staff_access_is_blocked()
    {
        $unauth = $this->getJson('/api/shift-config');
        $unauth->assertStatus(401);

        $staff = $this->withHeader('Authorization', 'Bearer ' . $this->staffToken)
            ->getJson('/api/shift-config');
        $staff->assertStatus(403);
    }

    public function test_save_and_reload_constraints_successfully()
    {
        $payload = [
            'constraints' => [
                [
                    'id'      => 'rest_between_shifts',
                    'enabled' => true,
                    'value'   => 14,
                ],
                [
                    'id'      => 'no_clopening',
                    'enabled' => false,
                ],
                [
                    'id'      => 'max_shifts_per_day',
                    'enabled' => true,
                    'value'   => 2,
                ],
            ],
        ];

        $saveRes = $this->withHeader('Authorization', 'Bearer ' . $this->managerToken)
            ->putJson('/api/shift-config', $payload);

        $saveRes->assertStatus(200);
        $saveRes->assertJson(['status' => true]);

        // Kiểm tra database
        $this->assertDatabaseHas('rang_buoc', [
            'ma_rang_buoc' => 'MIN_REST_HOURS',
        ]);
        $minRest = RangBuoc::where('ma_rang_buoc', 'MIN_REST_HOURS')->first();
        $this->assertEquals(14, $minRest->gia_tri['value']);
        $this->assertTrue($minRest->gia_tri['enabled']);

        $noClopening = RangBuoc::where('ma_rang_buoc', 'NO_NIGHT_TO_MORNING')->first();
        $this->assertFalse($noClopening->gia_tri['enabled']);

        // Tải lại bằng GET để xác thực đồng bộ
        $getRes = $this->withHeader('Authorization', 'Bearer ' . $this->managerToken)
            ->getJson('/api/shift-config');

        $constraints = collect($getRes->json('constraints'));
        $cRest = $constraints->firstWhere('id', 'rest_between_shifts');
        $this->assertEquals(14, $cRest['value']);
        $this->assertTrue($cRest['enabled']);

        $cClopen = $constraints->firstWhere('id', 'no_clopening');
        $this->assertFalse($cClopen['enabled']);
    }

    public function test_locked_constraints_remain_enabled()
    {
        // Cố tình gửi enabled: false cho ràng buộc bị khóa pháp lý
        $payload = [
            'constraints' => [
                [
                    'id'      => 'respect_approved_leave',
                    'enabled' => false,
                ],
                [
                    'id'      => 'max_consecutive_days',
                    'enabled' => false,
                    'value'   => 5,
                ],
            ],
        ];

        $saveRes = $this->withHeader('Authorization', 'Bearer ' . $this->managerToken)
            ->putJson('/api/shift-config', $payload);

        $saveRes->assertStatus(200);

        // Đọc lại để xác thực: các ràng buộc khóa vẫn phải giữ enabled: true
        $getRes = $this->withHeader('Authorization', 'Bearer ' . $this->managerToken)
            ->getJson('/api/shift-config');

        $constraints = collect($getRes->json('constraints'));
        $this->assertTrue($constraints->firstWhere('id', 'respect_approved_leave')['enabled']);
        $this->assertTrue($constraints->firstWhere('id', 'max_consecutive_days')['enabled']);
        $this->assertEquals(5, $constraints->firstWhere('id', 'max_consecutive_days')['value']);
    }

    public function test_constraint_validation_bounds()
    {
        // Test value < min (min_rest_hours < 12)
        $payloadLow = [
            'constraints' => [
                ['id' => 'rest_between_shifts', 'enabled' => true, 'value' => 8],
            ],
        ];
        $resLow = $this->withHeader('Authorization', 'Bearer ' . $this->managerToken)
            ->putJson('/api/shift-config', $payloadLow);
        $resLow->assertStatus(422);
        $resLow->assertJsonFragment(['status' => false]);
        $this->assertStringContainsString('từ 12 đến 24', $resLow->json('message'));

        // Test value > max (max_hours_per_day > 10)
        $payloadHigh = [
            'constraints' => [
                ['id' => 'max_hours_per_day', 'enabled' => true, 'value' => 14],
            ],
        ];
        $resHigh = $this->withHeader('Authorization', 'Bearer ' . $this->managerToken)
            ->putJson('/api/shift-config', $payloadHigh);
        $resHigh->assertStatus(422);
        $this->assertStringContainsString('từ 4 đến 10', $resHigh->json('message'));
    }

    public function test_save_and_reload_general_settings()
    {
        $payload = [
            'generalSettings' => [
                'availabilityDeadlineDay'  => 'saturday',
                'availabilityDeadlineTime' => '18:00',
                'gracePeriodMin'           => 10,
                'holidayMultiplier'        => 2.0,
                'holidays'                 => [
                    [
                        'id'         => 'h_test',
                        'name'       => 'Ngày thành lập quán',
                        'date'       => '2026-11-20',
                        'multiplier' => 2.0,
                    ],
                ],
            ],
        ];

        $saveRes = $this->withHeader('Authorization', 'Bearer ' . $this->managerToken)
            ->putJson('/api/shift-config', $payload);

        $saveRes->assertStatus(200);

        // GET lại để kiểm tra
        $getRes = $this->withHeader('Authorization', 'Bearer ' . $this->managerToken)
            ->getJson('/api/shift-config');

        $gen = $getRes->json('generalSettings');
        $this->assertEquals('saturday', $gen['availabilityDeadlineDay']);
        $this->assertEquals('18:00', $gen['availabilityDeadlineTime']);
        $this->assertEquals(10, $gen['gracePeriodMin']);
        $this->assertEquals(1, count($gen['holidays']));
        $this->assertEquals('Ngày thành lập quán', $gen['holidays'][0]['name']);
    }

    public function test_general_settings_validation()
    {
        // Grace period > 30 min
        $invalidGrace = [
            'generalSettings' => ['gracePeriodMin' => 45],
        ];
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->managerToken)
            ->putJson('/api/shift-config', $invalidGrace);
        $res->assertStatus(422);

        // Duplicate holiday dates
        $dupDates = [
            'generalSettings' => [
                'holidays' => [
                    ['id' => '1', 'name' => 'Lễ 1', 'date' => '2026-05-01', 'multiplier' => 1.5],
                    ['id' => '2', 'name' => 'Lễ 2', 'date' => '2026-05-01', 'multiplier' => 2.0],
                ],
            ],
        ];
        $dupRes = $this->withHeader('Authorization', 'Bearer ' . $this->managerToken)
            ->putJson('/api/shift-config', $dupDates);
        $dupRes->assertStatus(422);
        $this->assertStringContainsString('trùng lặp', $dupRes->json('message'));
    }
}
