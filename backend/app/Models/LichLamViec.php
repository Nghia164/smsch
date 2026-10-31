<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class LichLamViec extends Model
{
    use HasFactory;

    protected $table = 'lich_lam_viecs';

    public $timestamps = false;

    protected $fillable = [
        'tu_ngay',
        'den_ngay',
        'phien_ban',
        'trang_thai',
        'tao_boi',
    ];
}
