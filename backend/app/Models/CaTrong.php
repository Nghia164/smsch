<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CaTrong extends Model
{
    use HasFactory;

    protected $table = 'ca_trongs';

    public $timestamps = false;

    protected $fillable = [
        'phan_cong_ca_id',
        'han_dang_ky',
        'mo_ta',
        'trang_thai',
        'nguoi_mo_id',
    ];
}
