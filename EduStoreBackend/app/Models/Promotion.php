<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    protected $table = 'promotions';

    protected $fillable = [
        'titre',
        'description',
        'code_promo',
        'reduction_percent',
        'reduction_montant',
        'lien',
        'image_url',
        'date_debut',
        'date_fin',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
        'reduction_percent' => 'decimal:2',
        'reduction_montant' => 'decimal:2',
    ];
}

