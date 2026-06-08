<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('categorie_id');
            $table->string('nom', 255);
            $table->text('description')->nullable();
            $table->decimal('prix', 10, 2)->default(0);
            $table->string('image', 255)->nullable();
            $table->string('niveau_scolaire', 100)->nullable();
            $table->string('langue', 50)->default('Français');
            $table->boolean('disponible')->default(true);
            $table->timestamps();

            $table->foreign('categorie_id')
                  ->references('id')
                  ->on('categories')
                  ->onDelete('restrict')
                  ->onUpdate('cascade');

            $table->index('categorie_id');
            $table->index('disponible');
            $table->index('prix');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produits');
    }
};
