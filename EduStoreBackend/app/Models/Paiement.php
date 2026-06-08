<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    protected $table = 'paiements';

    protected $fillable = [
        'commande_id',
        'montant',
        'date_paiement',
        'methode',
        'statut',
    ];

    protected $casts = [
        'montant'        => 'decimal:2',
        'date_paiement'  => 'date',
    ];

    // ── Relations ──────────────────────────────────────────
    public function commande(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande_id');
    }

    // ── Methods (from diagram) ─────────────────────────────
    public function valider(): bool
    {
        $this->update([
            'statut'        => 'valide',
            'date_paiement' => now()->toDateString(),
        ]);

        // Confirm the linked order
        $this->commande->confirmer();

        return true;
    }
}
