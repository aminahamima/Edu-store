# Laravel Image Handling Guide

## ✅ Storage Link Created

The symbolic link has been successfully created:
```
public/storage -> storage/app/public
```

## 📁 Directory Structure

```
storage/app/public/        # Public storage (accessible via URL)
public/storage/            # Symbolic link to storage/app/public
```

## 🔧 How to Upload Images

### Option 1: Using File Upload in Controller

```php
use Illuminate\Support\Facades\Storage;

public function store(Request $request)
{
    $data = $request->validate([
        'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        'nom'   => 'required|string',
    ]);

    // Store the image in storage/app/public/produits
    $path = $request->file('image')->store('produits', 'public');
    
    // $path will be: "produits/image_name.jpg"
    
    // Save the path in database
    $produit = Produit::create([
        'nom' => $data['nom'],
        'image' => $path,
    ]);

    return response()->json([
        'message' => 'Produit créé',
        'image_url' => Storage::url($path),
    ]);
}
```

### Option 2: Using Storage::put()

```php
use Illuminate\Support\Facades\Storage;

public function store(Request $request)
{
    $image = $request->file('image');
    
    // Generate unique filename
    $filename = time() . '_' . $image->getClientOriginalName();
    
    // Store the image
    $path = Storage::disk('public')->putFileAs(
        'produits',
        $image,
        $filename
    );
    
    // Or using put() with file content
    $path = 'produits/' . $filename;
    Storage::disk('public')->put($path, file_get_contents($image));
    
    return $path;
}
```

### Option 3: Multiple Images

```php
public function store(Request $request)
{
    $data = $request->validate([
        'images' => 'required|array|max:5',
        'images.*' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
    ]);

    $imagePaths = [];
    
    foreach ($request->file('images') as $image) {
        $path = $image->store('produits', 'public');
        $imagePaths[] = $path;
    }

    // Store as JSON in database
    $produit = Produit::create([
        'nom' => $request->nom,
        'images' => json_encode($imagePaths),
    ]);

    return response()->json([
        'images' => $imagePaths,
        'urls' => array_map(fn($path) => Storage::url($path), $imagePaths),
    ]);
}
```

## 🖼️ How to Display Images in Blade Templates

### Method 1: Using asset() helper

```blade
<img src="{{ asset('storage/produits/image.jpg') }}" alt="Product Image">
```

### Method 2: Using Storage::url()

```blade
<img src="{{ Storage::url($produit->image) }}" alt="Product Image">
```

### Method 3: With fallback image

```blade
<img src="{{ $produit->image ? Storage::url($produit->image) : asset('images/placeholder.png') }}" 
     alt="Product Image">
```

### Method 4: Displaying multiple images

```blade
@foreach(json_decode($produit->images) as $image)
    <img src="{{ Storage::url($image) }}" alt="Product Image">
@endforeach
```

## 🎨 Complete Example: Updated ProduitController

```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ProduitController extends Controller
{
    // POST /api/produits (with file upload)
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'nom'          => 'required|string|max:255',
            'description'  => 'nullable|string',
            'prix'         => 'required|numeric|min:0',
            'image'        => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'images'       => 'nullable|array|max:5',
            'images.*'     => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'niveau_scolaire' => 'nullable|string|max:100',
            'langue'       => 'nullable|string|max:50',
            'disponible'   => 'boolean',
            'categorie_id' => 'required|exists:categories,id',
            'quantite_disponible' => 'nullable|integer|min:0',
            'seuil_alerte' => 'nullable|integer|min:0',
        ]);

        // Handle single image upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('produits', 'public');
            $data['image'] = $path;
        }

        // Handle multiple images upload
        if ($request->hasFile('images')) {
            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('produits', 'public');
                $imagePaths[] = $path;
            }
            $data['images'] = $imagePaths;
        }

        $stockData = [
            'quantite_disponible' => $data['quantite_disponible'] ?? 0,
            'seuil_alerte' => $data['seuil_alerte'] ?? 5,
            'date_mise_a_jour' => now()->toDateString(),
        ];
        unset($data['quantite_disponible'], $data['seuil_alerte']);

        $produit = Produit::create($data);
        $produit->stock()->updateOrCreate(['produit_id' => $produit->id], $stockData);

        return response()->json([
            'message' => 'Produit créé avec succès.',
            'produit' => $produit->load('categorie', 'stock'),
            'image_url' => $produit->image ? Storage::url($produit->image) : null,
        ], 201);
    }

    // PUT /api/produits/{id} (with file upload)
    public function update(Request $request, Produit $produit): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'nom'          => 'sometimes|required|string|max:255',
            'description'  => 'nullable|string',
            'prix'         => 'sometimes|required|numeric|min:0',
            'image'        => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'images'       => 'nullable|array|max:5',
            'images.*'     => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'niveau_scolaire' => 'nullable|string|max:100',
            'langue'       => 'nullable|string|max:50',
            'disponible'   => 'boolean',
            'categorie_id' => 'nullable|exists:categories,id',
            'quantite_disponible' => 'nullable|integer|min:0',
            'seuil_alerte' => 'nullable|integer|min:0',
        ]);

        // Handle image update - delete old image
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($produit->image && Storage::disk('public')->exists($produit->image)) {
                Storage::disk('public')->delete($produit->image);
            }
            
            // Store new image
            $path = $request->file('image')->store('produits', 'public');
            $data['image'] = $path;
        }

        // Handle multiple images update
        if ($request->hasFile('images')) {
            // Delete old images
            if ($produit->images && is_array($produit->images)) {
                foreach ($produit->images as $oldImage) {
                    if (Storage::disk('public')->exists($oldImage)) {
                        Storage::disk('public')->delete($oldImage);
                    }
                }
            }
            
            // Store new images
            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('produits', 'public');
                $imagePaths[] = $path;
            }
            $data['images'] = $imagePaths;
        }

        $stockPatch = [];
        if (isset($data['quantite_disponible'])) {
            $stockPatch['quantite_disponible'] = $data['quantite_disponible'];
            unset($data['quantite_disponible']);
        }
        if (isset($data['seuil_alerte'])) {
            $stockPatch['seuil_alerte'] = $data['seuil_alerte'];
            unset($data['seuil_alerte']);
        }
        if (!empty($stockPatch)) {
            $stockPatch['date_mise_a_jour'] = now()->toDateString();
            $produit->stock()->update($stockPatch);
        }

        $produit->update($data);

        return response()->json([
            'message' => 'Produit mis à jour.',
            'produit' => $produit->fresh()->load('categorie', 'stock'),
            'image_url' => $produit->image ? Storage::url($produit->image) : null,
        ]);
    }

    // DELETE /api/produits/{id}
    public function destroy(Request $request, Produit $produit): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        // Delete associated images
        if ($produit->image && Storage::disk('public')->exists($produit->image)) {
            Storage::disk('public')->delete($produit->image);
        }

        if ($produit->images && is_array($produit->images)) {
            foreach ($produit->images as $image) {
                if (Storage::disk('public')->exists($image)) {
                    Storage::disk('public')->delete($image);
                }
            }
        }

        $produit->delete();

        return response()->json(['message' => 'Produit supprimé.']);
    }
}
```

## 🔗 How to Get Image URLs in API Response

### In Controller (using Appends)

```php
// In Produit model
protected $appends = ['image_url'];

public function getImageUrlAttribute(): ?string
{
    return $this->image ? Storage::url($this->image) : null;
}
```

### In Controller (manually)

```php
public function index(Request $request): JsonResponse
{
    $produits = Produit::with('categorie', 'stock')->get();
    
    $produits->transform(function ($produit) {
        $produit->image_url = $produit->image ? Storage::url($produit->image) : null;
        return $produit;
    });

    return response()->json($produits);
}
```

## 📱 Frontend (React) Example

```javascript
// Upload image using FormData
const handleImageUpload = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('nom', 'Product Name');
  formData.append('prix', '99.99');
  formData.append('categorie_id', '1');

  try {
    const response = await api.post('/produits', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Image uploaded:', response.data);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Display image
<img src={produit.image_url} alt={produit.nom} />
```

## 🛠️ Useful Storage Commands

```bash
# Create symbolic link (already done)
php artisan storage:link

# Clear config cache
php artisan config:clear

# Clear application cache
php artisan cache:clear

# List files in storage
php artisan tinker
>>> Storage::disk('public')->files('produits')

# Delete a file
php artisan tinker
>>> Storage::disk('public')->delete('produits/image.jpg')
```

## 📝 Important Notes

1. **Storage Link**: Must be created once and recreated if you deploy to a new server
2. **Disk Configuration**: The 'public' disk is configured in `config/filesystems.php`
3. **URL Generation**: Use `Storage::url($path)` or `asset('storage/' . $path)`
4. **File Deletion**: Always delete files from storage when deleting records
5. **Validation**: Always validate file types and sizes to prevent security issues
6. **Image Optimization**: Consider using packages like `intervention/image` for optimization

## 🎯 Best Practices

1. Use `store()` method for automatic filename generation
2. Use `putFileAs()` for custom filenames
3. Always use the 'public' disk for files that need to be accessible via URL
4. Delete old files when updating to prevent storage bloat
5. Use proper validation for file uploads
6. Consider image optimization for better performance
7. Use unique filenames to prevent conflicts

## 🔒 Security Tips

1. Validate file types: `mimes:jpeg,png,jpg,gif,webp`
2. Limit file size: `max:2048` (2MB)
3. Sanitize filenames if using custom names
4. Never trust user input for file paths
5. Use Laravel's built-in storage methods instead of direct file operations
