<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DangKyCaTrong extends Model
{
    use HasFactory;

    protected $table = 'dang_ky_ca_trongs';

    public $timestamps = false;

    protected $fillable = [
        'ca_trong_id',
        'nhan_vien_id',
        'thoi_gian_dang_ky',
        'trang_thai',
    ];
}
