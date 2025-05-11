import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This is a simple implementation for demonstration
    // In a real app, you would generate an actual Excel file
    
    // Create a sample JSON structure that represents the Excel file
    const sampleData = {
      headers: [
        'Party Name',
        'Mobile Number',
        'Opening Balance',
        'Balance Type',
        'GST Number',
        'PAN Number',
        'Billing Address',
        'Billing Pin code',
        'Billing State',
        'Shipping Address',
        'Shipping Pin code',
        'Shipping State',
        'Account Holder Name',
        'Bank Name',
        'Account Number',
        'IFSC Code',
        'Branch Name'
      ],
      sampleRow: [
        'ABC Enterprises',
        '9876543210',
        '1000',
        'Receivable',
        'GSTIN123456789',
        'ABCDE1234F',
        '123 Main Street',
        '560001',
        'Karnataka',
        '123 Main Street',
        '560001',
        'Karnataka',
        'John Doe',
        'Sample Bank',
        '1234567890',
        'IFSC12345',
        'Sample Branch'
      ]
    };
    
    // In a real implementation, you would:
    // 1. Create an actual Excel file using a library like exceljs
    // 2. Set appropriate headers for file download
    // 3. Return the file as a stream or buffer
    
    // For this demo, we'll just return the JSON data
    return NextResponse.json(sampleData, {
      headers: {
        // These would be used in the real implementation
        'Content-Disposition': 'attachment; filename="party_import_template.json"'
      }
    });
  } catch (error) {
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 