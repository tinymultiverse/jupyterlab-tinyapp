/*
Copyright 2024 BlackRock, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Typography,
  CircularProgress
} from '@material-ui/core';
import { requestAPI } from '../middleware';

interface User {
  uid: string;
  cn: string;
  displayName: string;
  mail: string;
  label: string;
  value: string;
}

interface UserSearchFieldProps {
  selectedUsers: User[];
  onUsersChange: (users: User[]) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export const UserSearchField: React.FC<UserSearchFieldProps> = ({
  selectedUsers,
  onUsersChange,
  disabled = false,
  label = "Allowed Users",
  placeholder = "Search for users..."
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchFieldRef.current &&
        !searchFieldRef.current.contains(event.target as Node) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search for users with debouncing
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (searchText.length >= 2) {
      const timer = setTimeout(async () => {
        setIsLoading(true);
        try {
          const result = await requestAPI<{ data: { users: User[] } }>(
            `search_users?query=${encodeURIComponent(searchText)}`,
            { method: 'GET' }
          );
          
          // Filter out already selected users
          const availableUsers = result.data.users.filter(
            user => !selectedUsers.some(selected => selected.value === user.value)
          );
          
          setSearchResults(availableUsers);
          setShowResults(true);
        } catch (error) {
          console.error('Error searching users:', error);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);

      setDebounceTimer(timer);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [searchText, selectedUsers]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const handleUserSelect = (user: User) => {
    const newSelectedUsers = [...selectedUsers, user];
    onUsersChange(newSelectedUsers);
    setSearchText('');
    setShowResults(false);
  };

  const handleUserRemove = (userToRemove: User) => {
    const newSelectedUsers = selectedUsers.filter(
      user => user.value !== userToRemove.value
    );
    onUsersChange(newSelectedUsers);
  };

  const handleFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <Box style={{ position: 'relative' }}>
      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <Box style={{ marginBottom: '8px' }}>
          <Typography variant="caption" color="textSecondary">
            Selected Users:
          </Typography>
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
            {selectedUsers.map((user) => (
              <Chip
                key={user.value}
                label={user.label}
                onDelete={disabled ? undefined : () => handleUserRemove(user)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Search Input */}
      <div ref={searchFieldRef}>
        <TextField
          fullWidth
          label={label}
          placeholder={placeholder}
          value={searchText}
          onChange={handleSearchChange}
          onFocus={handleFocus}
          disabled={disabled}
          InputProps={{
            endAdornment: isLoading && <CircularProgress size={20} />
          }}
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div ref={resultsRef}>
          <Paper
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              maxHeight: '200px',
              overflow: 'auto'
            }}
          >
            <List dense>
              {searchResults.map((user) => (
                <ListItem
                  key={user.value}
                  button
                  onClick={() => handleUserSelect(user)}
                >
                  <ListItemText
                    primary={user.label}
                    secondary={user.mail || user.uid}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </div>
      )}

      {/* No results message */}
      {showResults && searchResults.length === 0 && searchText.length >= 2 && !isLoading && (
        <div ref={resultsRef}>
          <Paper
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              padding: '16px'
            }}
          >
            <Typography variant="body2" color="textSecondary">
              No users found for "{searchText}"
            </Typography>
          </Paper>
        </div>
      )}
    </Box>
  );
};