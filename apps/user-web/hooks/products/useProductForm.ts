import { CreateProductPayload, Product } from "@mall/types";
import { useState, useEffect, useCallback } from "react";

interface UseProductFormOptions {
    initialData?: Product | null;
    onSubmit: (payload: CreateProductPayload) => Promise<void>;
}

export function useProductForm({ initialData, onSubmit }: UseProductFormOptions) {
    // CreateProductPayload에 맞춘 초기 상태
    const [formData, setFormData] = useState<Partial<CreateProductPayload>>({
        productName: "",
        basePrice: 0,
        status: "DISPLAY",
        categoryIds: [],
        description: "",
        mainImageUrl: "",
        subImageUrls: [],
        options: [],
        sortOrder: 0,
    });
    
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                productName: initialData.productName,
                basePrice: initialData.basePrice,
                status: (initialData.status === "DISPLAY" || initialData.status === "HIDDEN") 
                    ? initialData.status 
                    : "HIDDEN",
                categoryIds: initialData.categoryIds,
                description: initialData.description,
                mainImageUrl: initialData.mainImageUrl,
                subImageUrls: initialData.subImageUrls,
                options: initialData.options,
                sortOrder: initialData.sortOrder,
                discountType: initialData.discountType,
                discountValue: initialData.discountValue,
                discountStartDate: initialData.discountStartDate,
                discountEndDate: initialData.discountEndDate,
            });
            setIsDirty(false);
        }
    }, [initialData]);

    const updateFormField = useCallback(<K extends keyof CreateProductPayload>(key: K, value: CreateProductPayload[K]) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        setIsDirty(true);
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData as CreateProductPayload);
            setIsDirty(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return { formData, isDirty, isSubmitting, updateFormField, handleSubmit };
}