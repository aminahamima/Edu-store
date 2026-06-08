<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categorie extends Model
{
    protected $table = 'categories';

    protected $fillable = [
        'nom',
        'description',
    ];

    // ── Relations ──────────────────────────────────────────
    public function produits(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Produit::class, 'categorie_id');
    }

    // ── Methods ────────────────────────────────────────────
    public function listerProduits(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->produits()->where('disponible', true)->get();
    }
}
