import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ProductCard } from '@/components/cart/product-card';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Search,
  Filter,
  ShoppingBag,
  ArrowLeft,
  ShoppingCart
} from 'lucide-react';

// Sample product data - in a real app, this would come from an API
const SAMPLE_PRODUCTS = [
  {
    id: 'p1',
    name: 'Pro Soccer Jersey',
    description: 'Professional grade soccer jersey with moisture-wicking fabric',
    price: 59.99,
    imageUrl: 'https://placehold.co/400x400/e2e8f0/1e293b?text=Soccer+Jersey',
    type: 'jersey',
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    availableGenders: ['mens', 'womens', 'youth']
  },
  {
    id: 'p2',
    name: 'Training Shorts',
    description: 'Lightweight training shorts perfect for practice sessions',
    price: 34.99,
    imageUrl: 'https://placehold.co/400x400/e2e8f0/1e293b?text=Training+Shorts',
    type: 'shorts',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    availableGenders: ['mens', 'womens', 'youth']
  },
  {
    id: 'p3',
    name: 'Team Jacket',
    description: 'Water-resistant team jacket with your team colors and logo',
    price: 89.99,
    imageUrl: 'https://placehold.co/400x400/e2e8f0/1e293b?text=Team+Jacket',
    type: 'jacket',
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    availableGenders: ['mens', 'womens']
  },
  {
    id: 'p4',
    name: 'Goalkeeper Gloves',
    description: 'Professional goalkeeper gloves with extra padding',
    price: 45.99,
    imageUrl: 'https://placehold.co/400x400/e2e8f0/1e293b?text=Goalkeeper+Gloves',
    type: 'gloves',
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableGenders: ['unisex']
  },
  {
    id: 'p5',
    name: 'Training Kit Bundle',
    description: 'Complete training kit including jersey, shorts and socks',
    price: 99.99,
    imageUrl: 'https://placehold.co/400x400/e2e8f0/1e293b?text=Training+Kit',
    type: 'bundle',
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableGenders: ['mens', 'womens', 'youth']
  },
  {
    id: 'p6',
    name: 'Premium Socks',
    description: 'High-quality socks with cushioning for maximum comfort',
    price: 14.99,
    imageUrl: 'https://placehold.co/400x400/e2e8f0/1e293b?text=Socks',
    type: 'socks',
    availableSizes: ['S', 'M', 'L'],
    availableGenders: ['unisex']
  },
];

const ProductsPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Filter products based on search query and category
  const filteredProducts = SAMPLE_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.type === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="hidden sm:flex"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Shop Products</h1>
        </div>
        
        <div className="flex items-center">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/checkout')}
            className="mr-2"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Checkout</span>
          </Button>
          
          <CartDrawer />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center">
          <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="jersey">Jerseys</SelectItem>
              <SelectItem value="shorts">Shorts</SelectItem>
              <SelectItem value="jacket">Jackets</SelectItem>
              <SelectItem value="gloves">Gloves</SelectItem>
              <SelectItem value="bundle">Bundles</SelectItem>
              <SelectItem value="socks">Socks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="h-16 w-16 mb-4 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold mb-2">No products found</h2>
          <p className="text-muted-foreground max-w-md">
            We couldn't find any products matching your search. Try different keywords or categories.
          </p>
          <Button variant="outline" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }} className="mt-4">
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              detailsLink={`/products/${product.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;