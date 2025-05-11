'use client';

import React from 'react';
import Link from 'next/link';

export default function SalesOrdersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Sales Orders</h1>
      <p className="mb-4">This page is being updated. Please check back later.</p>
      <Link href="/" className="text-blue-600 hover:underline">
        Return to Dashboard
      </Link>
    </div>
  );
}