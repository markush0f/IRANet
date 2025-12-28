import React from 'react';
import UsersPageHeader from './UsersPageHeader';
import UsersSummaryGrid from './UsersSummaryGrid';
import UsersTable from './UsersTable';
import { useUsersData } from '../../hooks/useUsersData';

const UsersView: React.FC = () => {
    const {
        searchTerm,
        setSearchTerm,
        typeFilter,
        setTypeFilter,
        filteredUsers,
        summary,
        loading,
        error,
    } = useUsersData();

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm min-h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6">
                <UsersPageHeader
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                    error={error}
                />

                <UsersSummaryGrid summary={summary} />
            </div>

            {/* Users container (auto height, scroll inside table if needed) */}
            <div className="panel accent-border rounded-2xl shadow-lg overflow-hidden">
                <UsersTable users={filteredUsers} loading={loading} summary={summary} />
            </div>
        </div>
    );
};

export default UsersView;
