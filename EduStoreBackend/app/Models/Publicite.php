<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Publicite extends Model
{
    protected $table = 'publicites';

    protected $fillable = [
        'titre',
        'description',
        'lien',
        'image_url',
        'date_debut',
        'date_fin',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];
}

