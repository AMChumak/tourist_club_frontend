import React, { useState, useEffect } from 'react';
import { CSSProperties } from 'react';
import axios from 'axios';


// Типы данных

interface PersonsList {
    page: number;
    total: number;
    persons: PersonShort[];
}

interface PersonShort {
    id: number;
    name: string;
    surname: string;
    patronymic: string;
}

interface PersonDetails extends PersonShort {
    properties: Record<string, string>;
}



type PageType = 'persons' | 'groups';

// Основной компонент
const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<PageType>('persons');
    const [searchTerm, setSearchTerm] = useState('');
    const [persons, setPersons] = useState<PersonShort[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<PersonDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /*// Эффекты и загрузка данных
    useEffect(() => {
        if (currentPage === 'persons') {
            fetchPersons();
        }
    }, [currentPage]);*/

    const onSearch = async (filters: {
        searchTerm: string;
        role: string;
        section?: string;
        group?: string;
        gender?: string;
        age?: string;
        birthYear?: string;
        additional?: Record<string, string>;
    }) => {
        try {
            setIsLoading(true);
            setError(null);

            // Определяем endpoint в зависимости от роли
            let endpoint = '';
            switch (filters.role) {
                case '0':
                    endpoint = '/tourists/filter';
                    break;
                case '1':
                    endpoint = '/trainers/filter';
                    break;
                case '2':
                    endpoint = '/managers/filter';
                    break;
                default:
                    throw new Error('Не выбрана роль');
            }

            // Формируем query параметры
            const params = new URLSearchParams();

            // Основные параметры
            if (filters.section) params.append('section', filters.section);
            if (filters.group) params.append('group', filters.group);
            if (filters.gender) params.append('sex', filters.gender);
            if (filters.age) params.append('age', filters.age);
            if (filters.birthYear) params.append('birth_year', filters.birthYear);

            // Дополнительные параметры в зависимости от роли
            if (filters.additional) {
                Object.entries(filters.additional).forEach(([key, value]) => {
                    if (value) params.append(key, value);
                });
            }

            // Отправляем запрос
            const response = await axios.get<PersonsList>(`http://localhost:8080${endpoint}?${params.toString()}`);

            // Обрабатываем ответ
            if (!Array.isArray(response.data.persons)) {
                throw new Error('Некорректный формат данных');
            }

            setPersons(response.data.persons);
        } catch (err) {
            setError('Ошибка при выполнении поиска');
            console.error('Ошибка поиска:', err);
            setPersons([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPersons = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get<PersonsList>('http://localhost:8080/tourists/filter');
            setPersons(response.data.persons);
        } catch (err) {
            setError('Не удалось загрузить список персон');
            console.error('Ошибка загрузки:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPersonDetails = async (personId: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await axios.get<PersonDetails>(`/api/persons/${personId}/details`);
            setSelectedPerson(response.data);
        } catch (err) {
            setError('Не удалось загрузить детали персоны');
            console.error('Ошибка загрузки:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Обработчики событий
    const handleNavItemClick = (page: PageType) => {
        setCurrentPage(page);
        setSelectedPerson(null);
        setSearchTerm('');
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handlePersonSelect = (person: PersonShort) => {
        setSelectedPerson(null);
        fetchPersonDetails(person.id);
    };

    // Вспомогательные функции
    const formatFullName = (person: PersonShort) => {
        return `${person.surname} ${person.name} ${person.patronymic}`;
    };

    const filteredPersons = persons.filter(person => {
        const fullName = formatFullName(person).toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    return (
        <div style={appStyle}>
            <NavigationPanel
                currentPage={currentPage}
                onNavItemClick={handleNavItemClick}
            />

            <ContentPanel
                isLoading={isLoading}
                error={error}
                persons={persons}
                filteredPersons={filteredPersons}
                selectedPerson={selectedPerson}
                searchTerm={searchTerm}
                onSearch={onSearch}
                onSearchChange={handleSearchChange}
                onPersonSelect={handlePersonSelect}
                formatFullName={formatFullName}
            />

            <DetailsPanel
                currentPage={currentPage}
                selectedPerson={selectedPerson}
                isLoading={isLoading}
                error={error}
                formatFullName={formatFullName}
            />
        </div>
    );
};

// Компонент левой панели навигации
const NavigationPanel: React.FC<{
    currentPage: PageType;
    onNavItemClick: (page: PageType) => void;
}> = ({ currentPage, onNavItemClick }) => {
    const navItems = [
        { id: 'persons', label: 'Персоны' },
        { id: 'groups', label: 'Группы' },
    ];

    return (
        <div style={navPanelStyle}>
            <h3 style={{ marginTop: 0 }}>Навигация</h3>
            <ul style={navListStyle}>
                {navItems.map((item) => (
                    <li
                        key={item.id}
                        onClick={() => onNavItemClick(item.id as PageType)}
                        style={{
                            ...navItemStyle,
                            backgroundColor: currentPage === item.id ? '#e0e0e0' : 'transparent',
                            fontWeight: currentPage === item.id ? 'bold' : 'normal'
                        }}
                    >
                        {item.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};




type PersonRole = {
    id: number
    role: string
}

type Section = {
    id: number
    title: string
}

type Group = {
    id: number
    group_number: number
    section: number
}


// Компонент центральной панели
interface FilterOptions {
    roles: PersonRole[];
    sections: Section[];
    groups: Group[];
}

const ContentPanel: React.FC<{
    isLoading: boolean;
    error: string | null;
    persons: PersonShort[];
    filteredPersons: PersonShort[];
    selectedPerson: PersonDetails | null;
    searchTerm: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPersonSelect: (person: PersonShort) => void;
    formatFullName: (person: PersonShort) => string;
    onSearch: (filters: any) => void;
}> = ({
          isLoading,
          error,
          persons,
          filteredPersons,
          selectedPerson,
          searchTerm,
          onSearchChange,
          onPersonSelect,
          formatFullName,
          onSearch
      }) => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        roles: [],
        sections: [],
        groups: []
    });
    const [filters, setFilters] = useState({
        role: '0',
        section: '',
        group: '',
        gender: '',
        age: '',
        birthYear: '',
        additional: {} as Record<string, string>
    });
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
    const [isLoadingFilters, setIsLoadingFilters] = useState(false);

    // Загрузка опций фильтров
    const loadFilterOptions = async () => {
        try {
            setIsLoadingFilters(true);
            const [rolesRes, sectionsRes, groupsRes] = await Promise.all([
                axios.get<PersonRole[]>('http://localhost:8080/roles/list'),
                axios.get<Section[]>('http://localhost:8080/sections/list'),
                axios.get<Group[]>('http://localhost:8080/groups/list')
            ]);

            setFilterOptions({
                roles: rolesRes.data,
                sections: sectionsRes.data,
                groups: groupsRes.data,
            });

        } catch (err) {
            console.error('Ошибка загрузки фильтров:', err);
        } finally {
            setIsLoadingFilters(false);
        }
    };

    useEffect(() => {
        loadFilterOptions();
    }, []);

    const handleFilterChange = (name: string, value: string) => {
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };

            // Очищаем взаимосвязанные поля
            if (name === 'age' && value) newFilters.birthYear = '';
            if (name === 'birthYear' && value) newFilters.age = '';

            return newFilters;
        });
    };

    const handleAdditionalFilterChange = (name: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            additional: { ...prev.additional, [name]: value }
        }));
    };

    const handleSearchSubmit = () => {
        onSearch({
            searchTerm,
            ...filters
        });
    };

    const filteredGroups = filters.section
        ? filterOptions.groups.filter(group => group.section.toString() === filters.section)
        : filterOptions.groups;

    const renderFilters = () => (
        <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    style={{ padding: '8px', minWidth: '150px' }}
                >
                    <option key={0} value={'0'}>{'турист'}</option>
                    <option key={1} value={'1'}>{'тренер'}</option>
                    <option key={2} value={'2'}>{'менеджер'}</option>
                </select>

                <select
                    value={filters.section}
                    onChange={(e) => handleFilterChange('section', e.target.value)}
                    style={{ padding: '8px', minWidth: '150px' }}
                >
                    <option value="">Секция</option>
                    {filterOptions.sections.map(section => (
                        <option key={section.id} value={section.id}>{section.title}</option>
                    ))}
                </select>

                <select
                    value={filters.group}
                    onChange={(e) => handleFilterChange('group', e.target.value)}
                    style={{ padding: '8px', minWidth: '150px' }}
                >
                    <option value="">Группа</option>
                    {filteredGroups.map(group => (
                        <option key={group.id} value={group.id}>{group.group_number}</option>
                    ))}
                </select>

                <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    style={{ padding: '8px', minWidth: '150px' }}
                >
                    <option value="">Пол</option>
                    <option value="0">Женский</option>
                    <option value="1">Мужской</option>
                </select>

                <input
                    type="number"
                    placeholder="Возраст"
                    value={filters.age}
                    onChange={(e) => handleFilterChange('age', e.target.value)}
                    min="0"
                    max="100"
                    disabled={!!filters.birthYear}
                    style={{ padding: '8px', width: '100px' }}
                />

                <input
                    type="number"
                    placeholder="Год рождения"
                    value={filters.birthYear}
                    onChange={(e) => handleFilterChange('birthYear', e.target.value)}
                    min="1920"
                    max="2025"
                    disabled={!!filters.age}
                    style={{ padding: '8px', width: '120px' }}
                />
            </div>

            {/* Дополнительные фильтры */}
            {filters.role && (
                <div style={{ marginTop: '10px' }}>
                    <h4>Дополнительные настройки</h4>
                    {renderAdditionalFilters(filters.role)}
                </div>
            )}

            <button
                onClick={handleSearchSubmit}
                style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
            >
                Поиск
            </button>
        </div>
    );

    const renderAdditionalFilters = (role: string) => {
        // Здесь можно реализовать логику для разных ролей
        // Например:
        if (role === 'teacher') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                        type="text"
                        placeholder="Предмет"
                        value={filters.additional.subject || ''}
                        onChange={(e) => handleAdditionalFilterChange('subject', e.target.value)}
                        style={{ padding: '8px' }}
                    />
                    <input
                        type="text"
                        placeholder="Квалификация"
                        value={filters.additional.qualification || ''}
                        onChange={(e) => handleAdditionalFilterChange('qualification', e.target.value)}
                        style={{ padding: '8px' }}
                    />
                </div>
            );
        }
        // Другие варианты для разных ролей
        return null;
    };

    const renderPersonsList = () => {
        if (isLoading && persons.length === 0) {
            return <div style={messageStyle}>Загрузка...</div>;
        }

        if (error) {
            return <div style={{ ...messageStyle, color: 'red' }}>{error}</div>;
        }

        if (filteredPersons.length === 0) {
            return <div style={messageStyle}>Ничего не найдено</div>;
        }

        return filteredPersons.map(person => (
            <button
                key={person.id}
                onClick={() => onPersonSelect(person)}
                style={{
                    ...listItemStyle,
                    backgroundColor: selectedPerson?.id === person.id ? '#e0e0e0' : 'white',
                }}
            >
                {formatFullName(person)}
            </button>
        ));
    };

    return (
        <div style={contentPanelStyle}>
            <h2 style={{ margin: 0 }}>Пользователи</h2>

            <div style={searchPanelStyle}>
                <input
                    type="text"
                    placeholder="Поиск по ФИО..."
                    value={searchTerm}
                    onChange={onSearchChange}
                    style={searchInputStyle}
                />
                <button
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    style={{ marginLeft: '10px', padding: '8px' }}
                >
                    {isFiltersExpanded ? 'Скрыть фильтры' : 'Показать фильтры'}
                </button>
            </div>

            {isFiltersExpanded && renderFilters()}

            <div style={listContainerStyle}>
                {renderPersonsList()}
            </div>
        </div>
    );
};

// Компонент правой панели с деталями
const DetailsPanel: React.FC<{
    currentPage: PageType;
    selectedPerson: PersonDetails | null;
    isLoading: boolean;
    error: string | null;
    formatFullName: (person: PersonShort) => string;
}> = ({ currentPage, selectedPerson, isLoading, error, formatFullName }) => {
    const renderPersonDetails = () => {
        if (!selectedPerson) {
            return (
                <div style={messageStyle}>
                    {currentPage === 'persons'
                        ? 'Выберите персону для просмотра деталей'
                        : 'Выберите группу для просмотра деталей'}
                </div>
            );
        }

        if (isLoading) {
            return <div style={messageStyle}>Загрузка деталей...</div>;
        }

        if (error) {
            return <div style={{ ...messageStyle, color: 'red' }}>{error}</div>;
        }

        return (
            <>
                <h2 style={{ marginTop: 0 }}>
                    {formatFullName(selectedPerson)}
                </h2>

                <div style={propertiesContainerStyle}>
                    <div style={propertyRowStyle}>
                        <span style={propertyLabelStyle}>ID:</span>
                        <span>{selectedPerson.id}</span>
                    </div>

                    {Object.entries(selectedPerson.properties).map(([key, value]) => (
                        <div key={key} style={propertyRowStyle}>
                            <span style={propertyLabelStyle}>{key}:</span>
                            <span>{value}</span>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <div style={detailsPanelStyle}>
            {renderPersonDetails()}
        </div>
    );
};


const appStyle: CSSProperties = {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden'
};

const navPanelStyle: CSSProperties = {
    width: '200px',
    backgroundColor: '#f0f0f0',
    padding: '20px',
    borderRight: '1px solid #ddd'
};

const navListStyle: CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0
};

const navItemStyle: CSSProperties = {
    padding: '10px 0',
    borderBottom: '1px solid #ddd',
    cursor: 'pointer'
};

const contentPanelStyle: CSSProperties = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
};

const searchPanelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f8f8f8',
    borderRadius: '5px'
};

const searchInputStyle: CSSProperties = {
    padding: '8px',
    flex: 1,
    borderRadius: '4px',
    border: '1px solid #ddd'
};

const listContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
};

const listItemStyle: CSSProperties = {
    padding: '12px',
    textAlign: 'left',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer'
};

const detailsPanelStyle: CSSProperties = {
    width: '350px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderLeft: '1px solid #ddd',
    overflowY: 'auto'
};

const propertiesContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
};

const propertyRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee'
};

const propertyLabelStyle: CSSProperties = {
    fontWeight: 'bold'
};

const messageStyle: CSSProperties = {
    padding: '20px',
    textAlign: 'center',
    color: '#666'
};
export default App;