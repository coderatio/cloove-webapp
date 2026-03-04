import { SaleModeView } from "@/app/domains/orders/components/SaleModeView";

export const metadata = {
    title: "Sale Mode | Cloove",
    description: "Record sales and manage transactions in POS mode.",
};

export default function SalePage() {
    return <SaleModeView />;
}
