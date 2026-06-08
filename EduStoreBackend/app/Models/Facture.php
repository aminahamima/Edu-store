<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    protected $table = 'factures';
    
    public $timestamps = false;

    protected $fillable = [
        'commande_id',
        'numero',
        'date_emission',
        'montant_ht',
        'montant_ttc',
        'fichier_pdf',
    ];

    protected $casts = [
        'date_emission' => 'date',
        'montant_ht'    => 'decimal:2',
        'montant_ttc'   => 'decimal:2',
    ];

    // ── Relations ──────────────────────────────────────────
    public function commande(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande_id');
    }

    // ── Methods (from diagram) ─────────────────────────────
    public function genererPDF(): string
    {
        // Return path/URL to generated PDF
        // e.g. use barryvdh/laravel-dompdf:
        // $pdf = PDF::loadView('factures.pdf', ['facture' => $this]);
        // return $pdf->save(storage_path("app/factures/{$this->numero}.pdf"));
        $path = storage_path("app/factures/{$this->numero}.pdf");
        if ($this->fichier_pdf !== $path) {
            $this->update(['fichier_pdf' => $path]);
        }
        return $path;
    }

    public function envoyer(): void
    {
        // e.g. Mail::to($this->commande->client->utilisateur->email)
        //          ->send(new FactureMail($this));
    }

    // ── Static factory ────────────────────────────────────
    public static function creerPourCommande(Commande $commande, float $tauxTva = 0.20): self
    {
        $ht  = $commande->montant_total / (1 + $tauxTva);
        $ttc = $commande->montant_total;

        return self::create([
            'commande_id'   => $commande->id,
            'numero'        => 'FAC-' . strtoupper(uniqid()),
            'date_emission' => now()->toDateString(),
            'montant_ht'    => round($ht, 2),
            'montant_ttc'   => round($ttc, 2),
        ]);
    }
}
