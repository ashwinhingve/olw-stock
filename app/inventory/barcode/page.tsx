'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  MagnifyingGlassIcon,
  QrCodeIcon,
  DocumentDuplicateIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  ViewColumnsIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import { useStore } from '@/context/storeContext';
import toast from 'react-hot-toast';
import BarcodeRenderer from '@/components/barcode/BarcodeRenderer';
import LabelTemplate, { LabelSize, LabelType } from '@/components/barcode/LabelTemplate';

interface Product {
  _id: string;
  sku: string;
  name: string;
  barcode: string;
  price?: number;
  category?: string;
  unit?: string;
  cost?: number;
  storeId?: string;
}

// Create wrapper component to replace Layout
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="container mx-auto px-4 py-8">{children}</div>
  );

export default function BarcodeGeneratorPage() {
  const { isLoading, setLoading } = useStore();
  const printSectionRef = useRef<HTMLDivElement>(null);
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Template and format settings
  const [labelSize, setLabelSize] = useState<LabelSize>('medium');
  const [labelType, setLabelType] = useState<LabelType>('detailed');
  const [barcodeFormat, setBarcodeFormat] = useState<'barcode' | 'qrcode' | 'datamatrix' | 'code128'>('barcode');
  const [showPrice, setShowPrice] = useState(true);
  const [showSKU, setShowSKU] = useState(true);
  const [customText, setCustomText] = useState('');
  const [labelCount, setLabelCount] = useState(1);
  
  // Print layout settings
  const [perPage, setPerPage] = useState(8);
  const [labelPadding, setLabelPadding] = useState(10); // in pixels
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Logo settings
  const [useLogo, setUseLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState('/your-company-logo.png');
  
  // Fetch products with barcodes from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      
      const response = await fetch(`/api/barcodes?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
        
        // Set categories for filter options
        if (data.filters?.categories) {
          setCategories(data.filters.categories);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      const err = error as Error; 
      toast.error(`Failed to load products data: ${err.message || 'Unknown error'}`);
      // Set defaults to prevent UI issues
      setProducts([]);
      setFilteredProducts([]);
      setSelectedProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);
  
  // Delayed search effect
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm) {
        fetchProducts();
      }
    }, 500);
    
    return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Barcode Generator</h1>
      <p>Barcode generator is being updated. Please check back later.</p>
    </div>
  );
  }, [searchTerm]);
  
  // Handle product selection
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product._id));
    }
  };
  
  const handleSelectProduct = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(productId => productId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };
  
  // Generate or update barcode
  const handleGenerateBarcode = async (productId: string) => {
    setLoading(true);
    try {
      // Generate a random 13-digit barcode (EAN-13 format)
      const barcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
      
      const response = await fetch('/api/barcodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          itemId: productId,
          barcode 
        }),
      }
  );
      
      if (!response.ok) {
        throw new Error('Failed to update barcode');
      }
      
      const data = await response.json();
      
      if (data.success) {
        fetchProducts();
        toast.success('Barcode generated successfully');
      } else {
        throw new Error(data.error || 'Failed to update barcode');
      }
    } catch (error) {
      console.error('Error generating barcode:', error);
      toast.error('Failed to generate barcode');
    } finally {
      setLoading(false);
    }
  };
  
  // Print functionality
  const handlePrint = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }
    
    const printContent = printSectionRef.current?.innerHTML || '';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .barcode-container {
              display: flex;
              flex-wrap: wrap;
              gap: ${labelPadding}px;
              padding: ${labelPadding}px;
              justify-content: center;
            }
            @media print {
              @page {
                margin: 0.5cm;
                size: auto;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
    ${printContent}
  </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  // Copy to clipboard
  const handleCopy = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    
    const selectedProductsData = selectedProducts
      .map(id => products.find(product => product._id === id))
      .filter((product): product is Product => !!product);
    
    const barcodeText = selectedProductsData
      .map(product => `${product.sku}: ${product.barcode}`)
      .join('\n');
    
    navigator.clipboard.writeText(barcodeText)
      .then(() => toast.success('Barcodes copied to clipboard'))
      .catch(err => {
        console.error('Failed to copy barcodes:', err);
        toast.error('Failed to copy barcodes to clipboard');
      }
  );
  };
  
  // Export as PDF (in real implementation, this would use a library like jsPDF)
  const handleExport = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    
    toast.success('Exporting barcodes as PDF...');
    // In a real app, implement PDF generation here
  };
  
  // Get selected products data
  const getSelectedProductsData = () => {
    return selectedProducts
      .map(id => products.find(product => product._id === id))
      .filter((product): product is Product => !!product);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Barcode Generator</h1>
      <p>Barcode generator is being updated. Please check back later.</p>
    </div>
  );
} 