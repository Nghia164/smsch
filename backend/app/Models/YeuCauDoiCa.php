<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class YeuCauDoiCa extends Model
{
    use HasFactory;

    protected $table = 'yeu_cau_doi_cas';

    public $timestamps = false;

    protected $fillable = [
        'nguoi_gui_id',
        'nguoi_nhan_id',
        'ca_gui_id',
        'ca_nhan_id',
        'ly_do',
        'trang_thai',
        'thoi_gian_phan_hoi',
        'nguoi_duyet_id',
        'thoi_gian_duyet',
    ];
}
