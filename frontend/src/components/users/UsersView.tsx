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
        <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">
            <UsersPageHeader
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                error={error}
            />

            <UsersSummaryGrid summary={summary} />

            <UsersFilterBar currentFilter={typeFilter} onFilterChange={setTypeFilter} />

            <UsersTable users={filteredUsers} loading={loading} summary={summary} />
        </div>
    );
};

export default UsersView;
