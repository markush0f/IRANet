import React from 'react';
import UsersPageHeader from './UsersPageHeader';
import UsersSummaryGrid from './UsersSummaryGrid';
import UsersFilterBar from './UsersFilterBar';
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
                    error={error}
                />

                <UsersSummaryGrid summary={summary} />

                <UsersFilterBar currentFilter={typeFilter} onFilterChange={setTypeFilter} />
            </div>

            {/* Users Container with Fixed Height */}
            <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col min-h-0">
                <UsersTable users={filteredUsers} loading={loading} summary={summary} />
            </div>
        </div>
    );
};

export default UsersView;
