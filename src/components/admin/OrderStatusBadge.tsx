import { Ban, CheckCircle2, Clock, CreditCard, Package, RotateCcw, Truck } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/types";

const STYLE: Record<OrderStatus, { tone: BadgeTone; Icon: typeof Clock }> = {
  PENDING_PAYMENT: { tone: "zinc", Icon: CreditCard },
  NEW: { tone: "blue", Icon: Clock },
  PROCESSING: { tone: "gold", Icon: Package },
  SHIPPED: { tone: "purple", Icon: Truck },
  DELIVERED: { tone: "green", Icon: CheckCircle2 },
  CANCELLED: { tone: "red", Icon: Ban },
  REFUNDED: { tone: "red", Icon: RotateCcw },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { tone, Icon } = STYLE[status];
  return (
    <Badge tone={tone}>
      <Icon className="h-3 w-3" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
