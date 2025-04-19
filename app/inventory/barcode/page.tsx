'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  MagnifyingGlassIcon,
  QrCodeIcon,
  DocumentDuplicateIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/ui/Layout';
import { useStore } from '@/context/storeContext';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  sku: string;
  name: string;
  barcode: string;
}

// Sample products data
const generateProductsData = (): Product[] => {
  return Array.from({ length: 20 }).map((_, index) => {
    return {
      id: index + 1,
      sku: `ITEM-${10000 + index}`,
      name: `Product ${index + 1}`,
      barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    };
  });
};

export default function BarcodeGeneratorPage() {
  const { isLoading, setLoading } = useStore();
  const printSectionRef = useRef<HTMLDivElement>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [barcodeSize, setBarcodeSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [barcodeCount, setBarcodeCount] = useState<number>(1);
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // In a real app, you'd fetch data from your API
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        const data = generateProductsData();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [setLoading]);
  
  // Handle search
  useEffect(() => {
    const filtered = products.filter(product => {
      const searchFields = [
        product.sku,
        product.name,
        product.barcode,
      ];
      
      return searchTerm === '' || 
        searchFields.some(field => 
          field && field.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });
    
    setFilteredProducts(filtered);
  }, [products, searchTerm]);
  
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product.id));
    }
  };
  
  const handleSelectProduct = (id: number) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(productId => productId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };
  
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
              gap: 10px;
              padding: 10px;
            }
            .barcode-item {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: center;
            }
            .barcode-sku {
              font-size: 12px;
              margin-bottom: 5px;
            }
            .barcode-name {
              font-size: 10px;
              margin-bottom: 5px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 120px;
            }
            .barcode-code {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              margin-top: 5px;
            }
            @media print {
              @page {
                margin: 0.5cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            ${printContent}
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
  
  const handleCopy = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    
    const selectedProductsData = selectedProducts
      .map(id => products.find(product => product.id === id))
      .filter((product): product is Product => !!product);
    
    const barcodeText = selectedProductsData
      .map(product => `${product.sku}: ${product.barcode}`)
      .join('\n');
    
    navigator.clipboard.writeText(barcodeText)
      .then(() => toast.success('Barcodes copied to clipboard'))
      .catch(err => {
        console.error('Failed to copy barcodes:', err);
        toast.error('Failed to copy barcodes to clipboard');
      });
  };
  
  const getBarcodeItemSize = () => {
    switch (barcodeSize) {
      case 'small':
        return 'w-24 h-14';
      case 'medium':
        return 'w-32 h-20';
      case 'large':
        return 'w-40 h-28';
      default:
        return 'w-32 h-20';
    }
  };
  
  const getBarcodeFontSize = () => {
    switch (barcodeSize) {
      case 'small':
        return 'text-[8px]';
      case 'medium':
        return 'text-xs';
      case 'large':
        return 'text-sm';
      default:
        return 'text-xs';
    }
  };
  
  const getBarcodeSVGSize = () => {
    switch (barcodeSize) {
      case 'small':
        return { width: 80, height: 30 };
      case 'medium':
        return { width: 100, height: 40 };
      case 'large':
        return { width: 120, height: 50 };
      default:
        return { width: 100, height: 40 };
    }
  };
  
  // Generate simple barcode SVG (in a real app, use a proper barcode library)
  const generateBarcodeSVG = (code: string) => {
    const { width, height } = getBarcodeSVGSize();
    
    if (showQRCode) {
      // Simple QR code representation (not a real QR code)
      return (
        <div className="flex items-center justify-center">
          <QrCodeIcon className={`${barcodeSize === 'small' ? 'h-8 w-8' : barcodeSize === 'medium' ? 'h-10 w-10' : 'h-12 w-12'} text-black`} />
        </div>
      );
    }
    
    // Simple barcode representation
    return (
      <svg width={width} height={height} className="mx-auto">
        <rect x="0" y="0" width={width} height={height} fill="white" />
        {code.split('').map((_, i) => {
          const x = (i * (width / code.length));
          const barWidth = width / code.length * 0.8;
          const isBlack = Math.random() > 0.5; // Random bars for demo
          return (
            <rect 
              key={i} 
              x={x} 
              y="5" 
              width={barWidth} 
              height={height - 10} 
              fill={isBlack ? "black" : "white"} 
            />
          );
        })}
      </svg>
    );
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Barcode Generator</h1>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              Copy
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Products
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by name, SKU, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Products</h3>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-md h-[calc(100vh-450px)] overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center p-4 text-sm text-gray-500">
                    No products found.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <li key={product.id} className="p-4 hover:bg-gray-50">
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            <p className="text-xs text-gray-500">Barcode: {product.barcode}</p>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-white shadow rounded-lg p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <label htmlFor="barcodeSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode Size
                </label>
                <select
                  id="barcodeSize"
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={barcodeSize}
                  onChange={(e) => setBarcodeSize(e.target.value as 'small' | 'medium' | 'large')}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="barcodeCount" className="block text-sm font-medium text-gray-700 mb-1">
                  Copies Per Item
                </label>
                <input
                  type="number"
                  id="barcodeCount"
                  min="1"
                  max="100"
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={barcodeCount}
                  onChange={(e) => setBarcodeCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                />
              </div>
              
              <div className="flex items-center">
                <label htmlFor="showQRCode" className="text-sm font-medium text-gray-700 mr-2">
                  Show as QR Code
                </label>
                <input
                  type="checkbox"
                  id="showQRCode"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={showQRCode}
                  onChange={(e) => setShowQRCode(e.target.checked)}
                />
              </div>
              
              <div className="flex-1"></div>
              
              <button
                onClick={() => {
                  // In a real app, provide actual download functionality
                  if (selectedProducts.length === 0) {
                    toast.error('Please select at least one product');
                    return;
                  }
                  toast.success('Downloading barcodes...');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
              
              {selectedProducts.length === 0 ? (
                <div className="text-center p-4 text-sm text-gray-500">
                  Select products to generate barcodes
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {selectedProducts.slice(0, 8).map(id => {
                    const product = products.find(p => p.id === id);
                    if (!product) return null;
                    
                    return (
                      <div 
                        key={product.id} 
                        className={`border border-gray-200 rounded flex flex-col items-center p-2 ${getBarcodeItemSize()}`}
                      >
                        <div className={`text-center ${getBarcodeFontSize()} font-semibold truncate w-full`}>
                          {product.sku}
                        </div>
                        <div className={`text-center ${getBarcodeFontSize()} truncate w-full mb-1`}>
                          {product.name}
                        </div>
                        {generateBarcodeSVG(product.barcode)}
                        <div className={`text-center ${getBarcodeFontSize()} font-mono mt-1`}>
                          {product.barcode}
                        </div>
                      </div>
                    );
                  })}
                  
                  {selectedProducts.length > 8 && (
                    <div className="flex items-center justify-center p-4 text-sm text-gray-500">
                      + {selectedProducts.length - 8} more
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Hidden section for printing */}
            <div className="hidden">
              <div ref={printSectionRef}>
                {selectedProducts.flatMap(id => {
                  const product = products.find(p => p.id === id);
                  if (!product) return [];
                  
                  return Array.from({ length: barcodeCount }).map((_, index) => (
                    <div 
                      key={`${product.id}-${index}`} 
                      className="barcode-item"
                      style={{
                        width: getBarcodeSVGSize().width + 20,
                        height: getBarcodeSVGSize().height + 40
                      }}
                    >
                      <div className="barcode-sku">{product.sku}</div>
                      <div className="barcode-name">{product.name}</div>
                      <Image 
                        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" width="${getBarcodeSVGSize().width}" height="${getBarcodeSVGSize().height}">
                            <rect x="0" y="0" width="${getBarcodeSVGSize().width}" height="${getBarcodeSVGSize().height}" fill="white" />
                            ${product.barcode.split('').map((_, i) => {
                              const x = (i * (getBarcodeSVGSize().width / product.barcode.length));
                              const barWidth = getBarcodeSVGSize().width / product.barcode.length * 0.8;
                              // Use consistent pattern based on character code to ensure same barcode for same string
                              const isBlack = i % 3 === 0 || product.barcode.charCodeAt(i % product.barcode.length) % 2 === 0;
                              return `<rect x="${x}" y="5" width="${barWidth}" height="${getBarcodeSVGSize().height - 10}" fill="${isBlack ? "black" : "white"}" />`;
                            }).join('')}
                          </svg>`
                        )}`}
                        alt={`Barcode for ${product.sku}`}
                        width={getBarcodeSVGSize().width}
                        height={getBarcodeSVGSize().height}
                        unoptimized
                      />
                      <div className="barcode-code">{product.barcode}</div>
                    </div>
                  ));
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 