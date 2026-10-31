<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TuanDangKy extends Model
{
    use HasFactory;

    protected $table = 'tuan_dang_kies';

    public $timestamps = false;

    protected $fillable = [
        'nhan_vien_id',
        'tu_ngay',
        'den_ngay',
        'trang_thai',
        'thoi_gian_gui',
    ];
}
