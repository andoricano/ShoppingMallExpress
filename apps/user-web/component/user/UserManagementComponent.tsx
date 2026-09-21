"use client";

import React from "react";

import { useUserManagement } from "@/hooks/useUserManagement";
import { UserSearchToolbar } from "@/component/user/UserSearchToolbar";
import { UserTable } from "@/component/user/UserTable";
import { UserDetailPanel } from "@/component/user/UserDetailPanel";
import { UserProfile } from "@mall/types";

interface UserManagementComponentProps {
    users: UserProfile[];
    isLoading?: boolean;
    onUsersChange: (users: UserProfile[]) => void;

    title?: string;
    description?: string;
    maxWidth?: number;
    detailPanelWidth?: number;
    className?: string;
}

export default function UserManagementComponent({
    users,
    isLoading = false,
    onUsersChange,
    title = "회원 관리",
    description = "등록된 고객(Client) 및 관리자(Admin) 계정을 조회하고 권한과 상세 정보를 관리합니다.",
    maxWidth = 1400,
    detailPanelWidth = 380,
    className = "",
}: UserManagementComponentProps) {
    const {
        selectedUser,
        users: filteredUsers,
        actionError,
        filters,
        handleKeywordChange,
        handleRoleFilterChange,
        handleOnboardedFilterChange,
        handleResetFilters,
        handleSelectUser,
        handleCloseDetail,
        handleRoleChange,
    } = useUserManagement({
        users,
        onUsersChange,
    });

    return (
        <div
            className={className}
            style={{
                padding: "32px",
                maxWidth: `${maxWidth}px`,
                margin: "0 auto",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            {/* 1. 페이지 타이틀 영역 */}
            <div style={{ marginBottom: "24px" }}>
                <h1
                    style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        margin: "0 0 8px 0",
                    }}
                >
                    {title}
                </h1>

                <p
                    style={{
                        margin: 0,
                        color: "#6c757d",
                        fontSize: "14px",
                    }}
                >
                    {description}
                </p>
            </div>

            {/* 2. 검색 및 필터 툴바 */}
            <UserSearchToolbar
                filters={filters}
                onKeywordChange={
                    handleKeywordChange
                }
                onRoleChange={
                    handleRoleFilterChange
                }
                onOnboardedChange={
                    handleOnboardedFilterChange
                }
                onReset={
                    handleResetFilters
                }
            />

            {actionError && (
                <p className="mb-4 text-sm text-rose-600">
                    {actionError}
                </p>
            )}

            {/* 3. 메인 콘텐츠 */}
            <div
                style={{
                    display: "flex",
                    gap: "24px",
                    alignItems: "flex-start",
                    width: "100%",
                }}
            >
                {/* 회원 테이블 */}
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        width: "100%",
                    }}
                >
                    <UserTable
                        users={filteredUsers}
                        selectedUserId={
                            selectedUser?.id
                        }
                        onSelectUser={
                            handleSelectUser
                        }
                        isLoading={
                            isLoading
                        }
                    />
                </div>

                {/* 상세 패널 */}
                <div
                    style={{
                        width: `${detailPanelWidth}px`,
                        flexShrink: 0,
                    }}
                >
                    {selectedUser ? (
                        <UserDetailPanel
                            user={selectedUser}
                            onClose={
                                handleCloseDetail
                            }
                            onRoleChange={
                                handleRoleChange
                            }
                        />
                    ) : (
                        <div
                            style={{
                                width: `${detailPanelWidth}px`,
                                height: "200px",
                                border: "1px dashed #ced4da",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                color: "#868e96",
                                fontSize: "14px",
                                boxSizing:
                                    "border-box",
                            }}
                        >
                            목록에서 회원을 선택하면
                            상세 정보가 표시됩니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
