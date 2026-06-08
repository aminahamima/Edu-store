<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    protected $table = 'stocks';
    
    public $timestamps = false;

    protected $fillable = [
        'produit_id',
        'quantite_disponible',
        'seuil_alerte',
        'date_mise_a_jour',
    ];

    protected $casts = [
        'date_mise_a_jour' => 'date',
    ];

    // ── Relations ──────────────────────────────────────────
    public function produit(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Produit::class, 'produit_id');
    }

    // ── Methods (from diagram) ─────────────────────────────
    public function verifierSeuil(): bool
    {
        return $this->quantite_disponible <= $this->seuil_alerte;
    }

    public function envoyerAlerte(): void
    {
        if ($this->verifierSeuil()) {
            // Dispatch notification / event here
            // e.g. event(new StockFaibleEvent($this));
        }
    }

    public function mettreAJour(int $quantite): void
    {
        $this->update([
            'quantite_disponible' => $quantite,
            'date_mise_a_jour'    => now()->toDateString(),
        ]);
    }
}
