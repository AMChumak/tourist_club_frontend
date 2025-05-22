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

interface Group {
    id: number;
    name: string;
    members: number;
    // ... другие поля группы
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

    // Эффекты и загрузка данных
    useEffect(() => {
        if (currentPage === 'persons') {
            fetchPersons();
        }
    }, [currentPage]);

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
                currentPage={currentPage}
                isLoading={isLoading}
                error={error}
                persons={persons}
                filteredPersons={filteredPersons}
                selectedPerson={selectedPerson}
                searchTerm={searchTerm}
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

// Компонент центральной панели
const ContentPanel: React.FC<{
    currentPage: PageType;
    isLoading: boolean;
    error: string | null;
    persons: PersonShort[];
    filteredPersons: PersonShort[];
    selectedPerson: PersonDetails | null;
    searchTerm: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPersonSelect: (person: PersonShort) => void;
    formatFullName: (person: PersonShort) => string;
}> = ({
          currentPage,
          isLoading,
          error,
          persons,
          filteredPersons,
          selectedPerson,
          searchTerm,
          onSearchChange,
          onPersonSelect,
          formatFullName
      }) => {
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
            <h2 style={{ margin: 0 }}>
                {currentPage === 'persons' ? 'Персоны' : 'Группы'}
            </h2>

            {currentPage === 'persons' ? (
                <>
                    <div style={searchPanelStyle}>
                        <input
                            type="text"
                            placeholder="Поиск по ФИО..."
                            value={searchTerm}
                            onChange={onSearchChange}
                            style={searchInputStyle}
                        />
                    </div>

                    <div style={listContainerStyle}>
                        {renderPersonsList()}
                    </div>
                </>
            ) : (
                <div style={messageStyle}>Раздел групп в разработке</div>
            )}
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