<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->unsignedBigInteger('id');
            $table->string('adresse_livraison', 255)->nullable();
            $table->text('historique_commandes')->nullable();
            $table->timestamps();

            $table->primary('id');
            $table->foreign('id')
                  ->references('id')
                  ->on('utilisateurs')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
