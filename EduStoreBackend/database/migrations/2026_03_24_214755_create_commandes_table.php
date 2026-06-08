<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commandes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('utilisateur_id');
            $table->string('numero_commande', 30)->unique();
            $table->enum('statut', [
                'en_attente',
                'confirmee',
                'en_livraison',
                'livree',
                'annulee',
            ])->default('en_attente');
            $table->decimal('montant_total', 10, 2)->default(0);
            $table->string('adresse_livraison', 255);
            $table->string('telephone_livraison', 20);
            $table->enum('mode_paiement', ['livraison'])->default('livraison');
            $table->text('note')->nullable();
            $table->timestamp('date_commande')->useCurrent();
            $table->timestamps();

            $table->foreign('utilisateur_id')
                  ->references('id')
                  ->on('utilisateurs')
                  ->onDelete('restrict')
                  ->onUpdate('cascade');

            $table->index('utilisateur_id');
            $table->index('statut');
            $table->index('date_commande');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commandes');
    }
};
