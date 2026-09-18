"use client";

import { MyProfileSection } from "./MyProfileSection";
import { ShippingAddressSection } from "./ShippingAddressSection";

export function MyInfoSection() {
    return (
        <section className="space-y-6">
            <MyProfileSection />
            <ShippingAddressSection/>
        </section>
    );
}