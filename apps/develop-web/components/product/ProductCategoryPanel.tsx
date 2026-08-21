// @/components/product/ProductCategoryPanel.tsx
"use client";

import { ProductCategory } from "@mall/types";
import { AddCategoryBox } from "./category/AddCategoryBox";
import { CategoryTreeViewer } from "./category/CategoryTreeViewer";

interface ProductCategoryPanelProps {
    categoryList?: ProductCategory[];
    onCreateCategory?: (payload: Omit<ProductCategory, "categoryId">) => Promise<boolean>;
    onUpdateCategory?: (categoryId: string, payload: Partial<ProductCategory>) => Promise<boolean>; // onUpdateCategory 인터페이스 정의 유지
    onDeleteCategory?: (categoryId: string) => Promise<boolean>;
}

export function ProductCategoryPanel({
    categoryList = [],
    onCreateCategory,
    onUpdateCategory, // onUpdateCategory Props 추출 주석: 상위 패널로부터 받아온 수정 핸들러 연결
    onDeleteCategory,
}: ProductCategoryPanelProps) {
    const getFlattenCategories = (
        nodes: ProductCategory[],
        prefix = ""
    ): Array<{ id: string; name: string; depth: number }> => {
        let result: Array<{ id: string; name: string; depth: number }> = [];
        if (!nodes) return result;
        for (const node of nodes) {
            result.push({
                id: node.categoryId,
                name: `${prefix}${node.categoryName}`,
                depth: node.depth,
            });
            if (node.children && node.children.length > 0) {
                result = result.concat(
                    getFlattenCategories(node.children, `${prefix}${node.categoryName} > `)
                );
            }
        }
        return result;
    };

    const flatCategoryOptions = getFlattenCategories(categoryList);

    const handleAddCategory = async (data: {
        categoryName: string;
        parentId: string | null;
        displayOrder: number;
    }): Promise<boolean> => {
        let depth = 1;

        if (data.parentId) {
            const parentCat = flatCategoryOptions.find((c) => c.id === data.parentId);
            if (parentCat) {
                if (parentCat.depth >= 3) {
                    alert("카테고리는 최대 3단계(depth)까지만 생성 가능합니다.");
                    return false;
                }
                depth = parentCat.depth + 1;
            }
        }

        const payload = {
            categoryName: data.categoryName,
            parentId: data.parentId,
            depth,
            displayOrder: data.displayOrder,
        };

        if (onCreateCategory) {
            return await onCreateCategory(payload);
        } else {
            alert(`[테스트] 카테고리 생성 요청: ${JSON.stringify(payload, null, 2)}`);
            return true;
        }
    };

    // 카테고리 삭제
    const handleDelete = async (categoryId: string, name: string) => {
        if (!confirm(`'${name}' 카테고리를 정말 삭제하시겠습니까?\n하위 카테고리가 있다면 함께 영향을 받습니다.`)) {
            return;
        }

        if (onDeleteCategory) {
            await onDeleteCategory(categoryId);
        } else {
            alert(`[테스트] 카테고리 삭제 요청 ID: ${categoryId}`);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-zinc-300">
            {/* 1. 카테고리 구조 트리 뷰어 컴포넌트 */}
            <CategoryTreeViewer
                categoryList={categoryList}
                onDeleteCategory={handleDelete}
                onUpdateCategory={onUpdateCategory} // CategoryTreeViewer로 수정 핸들러 전달 주석: 트리 뷰어로 수정 기능 전달
            />

            {/* 2. 카테고리 신규 추가 폼 */}
            <div>
                <AddCategoryBox
                    categoryList={categoryList}
                    onAddCategory={handleAddCategory}
                />
            </div>
        </div>
    );
}