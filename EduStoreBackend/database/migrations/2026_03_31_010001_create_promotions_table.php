<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();

            $table->string('titre', 150);
            $table->text('description')->nullable();

            $table->string('code_promo', 80)->nullable()->unique();
            $table->decimal('reduction_percent', 5, 2)->nullable();
            $table->decimal('reduction_montant', 10, 2)->nullable();

            $table->string('lien', 255)->nullable();
            $table->string('image_url', 500)->nullable();

            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();

            $table->boolean('active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};

