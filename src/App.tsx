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

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<PageType>('persons');
    const [searchTerm, setSearchTerm] = useState('');
    const [persons, setPersons] = useState<PersonShort[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<PersonDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Загрузка списка персон при монтировании
    useEffect(() => {
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

        if (currentPage === 'persons') {
            fetchPersons();
        }
    }, [currentPage]);

    // Загрузка деталей персоны
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

    // Обработчики
    const handleNavItemClick = (page: PageType) => {
        setCurrentPage(page);
        setSelectedPerson(null);
        setSearchTerm('');
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handlePersonSelect = (person: PersonShort) => {
        setSelectedPerson(null); // Сбрасываем перед загрузкой новых данных
        fetchPersonDetails(person.id);
    };

    // Фильтрация персон
    const filteredPersons = persons.filter(person => {
        const fullName = `${person.surname} ${person.name} ${person.patronymic}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    // Форматирование ФИО
    const formatFullName = (person: PersonShort) => {
        return `${person.surname} ${person.name} ${person.patronymic}`;
    };

    return (
        <div style={appStyle}>
            {/* Левая панель - навигация */}
            <div style={navPanelStyle}>
                <h3 style={{ marginTop: 0 }}>Навигация</h3>
                <ul style={navListStyle}>
                    {[
                        { id: 'persons', label: 'Персоны' },
                        { id: 'groups', label: 'Группы' },
                    ].map((item) => (
                        <li
                            key={item.id}
                            onClick={() => handleNavItemClick(item.id as PageType)}
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

            {/* Центральная панель - контент */}
            <div style={contentPanelStyle}>
                <h2 style={{ margin: 0 }}>
                    {currentPage === 'persons' ? 'Персоны' : 'Группы'}
                </h2>

                {currentPage === 'persons' ? (
                    <>
                        {/* Поиск для персон */}
                        <div style={searchPanelStyle}>
                            <input
                                type="text"
                                placeholder="Поиск по ФИО..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                style={searchInputStyle}
                            />
                        </div>

                        {/* Список персон */}
                        <div style={listContainerStyle}>
                            {isLoading && persons.length === 0 ? (
                                <div style={messageStyle}>Загрузка...</div>
                            ) : error ? (
                                <div style={{ ...messageStyle, color: 'red' }}>{error}</div>
                            ) : filteredPersons.length > 0 ? (
                                filteredPersons.map(person => (
                                    <button
                                        key={person.id}
                                        onClick={() => handlePersonSelect(person)}
                                        style={{
                                            ...listItemStyle,
                                            backgroundColor: selectedPerson?.id === person.id ? '#e0e0e0' : 'white',
                                        }}
                                    >
                                        {formatFullName(person)}
                                    </button>
                                ))
                            ) : (
                                <div style={messageStyle}>Ничего не найдено</div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={messageStyle}>Раздел групп в разработке</div>
                )}
            </div>

            {/* Правая панель - детали */}
            <div style={detailsPanelStyle}>
                {selectedPerson ? (
                    <>
                        <h2 style={{ marginTop: 0 }}>
                            {formatFullName(selectedPerson)}
                        </h2>

                        {isLoading ? (
                            <div style={messageStyle}>Загрузка деталей...</div>
                        ) : error ? (
                            <div style={{ ...messageStyle, color: 'red' }}>{error}</div>
                        ) : (
                            <div style={propertiesContainerStyle}>
                                {/* Статические поля */}
                                <div style={propertyRowStyle}>
                                    <span style={propertyLabelStyle}>ID:</span>
                                    <span>{selectedPerson.id}</span>
                                </div>

                                {/* Динамические свойства */}
                                {Object.entries(selectedPerson.properties).map(([key, value]) => (
                                    <div key={key} style={propertyRowStyle}>
                                        <span style={propertyLabelStyle}>{key}:</span>
                                        <span>{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={messageStyle}>
                        {currentPage === 'persons'
                            ? 'Выберите персону для просмотра деталей'
                            : 'Выберите группу для просмотра деталей'}
                    </div>
                )}
            </div>
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