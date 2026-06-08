<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LigneCommande extends Model
{
    protected $table = 'lignes_commande';
    
    public $timestamps = false;

    protected $fillable = [
        'commande_id',
        'produit_id',
        'quantite',
        'prix_unitaire',
        'sous_total',
    ];

    protected $casts = [
        'prix_unitaire' => 'decimal:2',
    ];

    // ── Relations ──────────────────────────────────────────
    public function commande(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande_id');
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
