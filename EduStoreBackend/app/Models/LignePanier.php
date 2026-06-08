<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LignePanier extends Model
{
    protected $table = 'lignes_panier';

    protected $fillable = [
        'panier_id',
        'produit_id',
        'quantite',
        'prix_unitaire',
    ];

    protected $casts = [
        'prix_unitaire' => 'decimal:2',
    ];

    // ── Relations ──────────────────────────────────────────
    public function panier(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Panier::class, 'panier_id');
    }

    public function produit(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Produit::class, 'produit_id');
    }

    // ── Methods (from diagram) ─────────────────────────────
    public function calculerSousTotal(): float
    {
        return (float) ($this->quantite * $this->prix_unitaire);
    }
}
