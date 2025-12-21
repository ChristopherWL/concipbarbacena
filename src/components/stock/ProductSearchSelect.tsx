import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  code: string;
  name: string;
  current_stock?: number;
  unit?: string;
  is_serialized?: boolean;
}

interface ProductSearchSelectProps {
  products: Product[] | undefined;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStock?: boolean;
  className?: string;
}

export function ProductSearchSelect({
  products,
  value,
  onChange,
  placeholder = "Selecione um produto",
  showStock = false,
  className,
}: ProductSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products?.find(p => p.id === value);
  
  const filteredProducts = products?.filter(p => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      p.code.toLowerCase().includes(searchLower) ||
      p.name.toLowerCase().includes(searchLower)
    );
  }) || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (productId: string) => {
    onChange(productId);
    setIsOpen(false);
    setSearch('');
  };

  const displayValue = isOpen 
    ? search 
    : selectedProduct 
      ? `${selectedProduct.code} - ${selectedProduct.name}`
      : '';

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={displayValue}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-12"
        />
        <ChevronDown 
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          <ScrollArea className="max-h-[300px]">
            <div className="p-1">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum produto encontrado
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelect(product.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-md transition-colors text-sm",
                      value === product.id 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="font-medium">{product.code}</span>
                    <span className="text-muted-foreground"> - {product.name}</span>
                    {showStock && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {product.is_serialized 
                          ? '(Serializado)' 
                          : `(Estoque: ${product.current_stock})`}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
