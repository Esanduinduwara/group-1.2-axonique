// Shared types used across the entire app

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  emoji: string;
  imageUrl?: string;
  badge: string | null;
  sizes: string[];
  desc: string;
  inStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  lowStock: boolean;
}

export interface CartItem {
  product: Product;
  size: string;
  qty: number;
}

export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  productName: string;
  productCategory: string;
  selectedSize: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  role: string;
  enabled: boolean;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: Record<string, number>;
  estimatedCost: number;
  estimatedProfit: number;
}

export interface StaffActivity {
  recentOrders: {
    id: number;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  recentRegistrations: {
    id: number;
    username: string;
    email: string;
    createdAt: string;
  }[];
}

export interface BrandProfile {
  id: number;
  logoUrl: string | null;
  heroBannerUrl: string | null;
  discountBannerText: string | null;
  discountBannerActive: boolean;
  mission: string | null;
  vision: string | null;
  policies: string | null;
  updatedAt: string;
}