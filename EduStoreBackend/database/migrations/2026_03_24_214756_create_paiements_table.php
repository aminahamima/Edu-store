<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('commande_id')->unique();
            $table->decimal('montant', 10, 2)->default(0);
            $table->enum('methode', ['livraison'])->default('livraison');
            $table->enum('statut', [
                'en_attente',
                'paye',
                'rembourse',
                'echoue',
            ])->default('en_attente');
            $table->timestamp('date_paiement')->nullable();
            $table->timestamps();

            $table->foreign('commande_id')
                  ->references('id')
                  ->on('commandes')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
