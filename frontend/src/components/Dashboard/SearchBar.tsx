import React, { useState, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  showFilters?: boolean;
  activeFilters?: string[];
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = '검색...',
  onFilterClick,
  showFilters = false,
  activeFilters = [],
}) => {
  const [localValue, setLocalValue] = useState(value);

  // 디바운싱을 위한 useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  // 외부에서 value가 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      onChange(localValue);
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyPress={handleKeyPress}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {localValue && (
                <Tooltip title="검색어 지우기">
                  <IconButton
                    size="small"
                    onClick={handleClear}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              )}
              {showFilters && (
                <Tooltip title="필터">
                  <IconButton
                    size="small"
                    onClick={onFilterClick}
                    edge="end"
                    color={activeFilters.length > 0 ? 'primary' : 'default'}
                  >
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
          },
        }}
      />
      
      {/* 활성 필터 표시 */}
      {activeFilters.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {activeFilters.map((filter, index) => (
            <Chip
              key={index}
              label={filter}
              size="small"
              onDelete={() => {
                // TODO: 필터 제거 로직 구현
                console.log('Remove filter:', filter);
              }}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SearchBar;