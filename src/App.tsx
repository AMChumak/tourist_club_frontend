import React, { useState } from 'react';

// Типы данных для Persons
interface Person {
    id: number;
    fullName: string;
    age: number;
    occupation: string;
    email: string;
    phone: string;
    address: string;
}

// Типы данных для Groups
interface Group {
    id: number;
    name: string;
    members: number;
    createdDate: string;
    description: string;
    leader: string;
    status: 'active' | 'inactive';
}

// Моковые данные для Persons
const mockPersons: Person[] = [
    {
        id: 1,
        fullName: 'Иванов Иван Иванович',
        age: 35,
        occupation: 'Инженер',
        email: 'ivanov@example.com',
        phone: '+7 (123) 456-7890',
        address: 'г. Москва, ул. Ленина, д. 10'
    },
    // ... другие персоны
];

// Моковые данные для Groups
const mockGroups: Group[] = [
    {
        id: 1,
        name: 'Разработчики React',
        members: 12,
        createdDate: '2023-01-15',
        description: 'Группа для разработчиков на React',
        leader: 'Иванов И.И.',
        status: 'active'
    },
    // ... другие группы
];

type PageType = 'persons' | 'groups';

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<PageType>('persons');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<Person | Group | null>(null);

    // Обработчики
    const handleNavItemClick = (page: PageType) => {
        setCurrentPage(page);
        setSelectedItem(null);
        setSearchTerm('');
        setSelectedFilter('');
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFilter(e.target.value);
    };

    const handleItemSelect = (item: Person | Group) => {
        setSelectedItem(item);
    };

    // Фильтрация данных
    const filteredItems = currentPage === 'persons'
        ? mockPersons.filter(person => {
            const matchesSearch = person.fullName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = selectedFilter ? person.occupation === selectedFilter : true;
            return matchesSearch && matchesFilter;
        })
        : mockGroups.filter(group => {
            const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = selectedFilter ? group.status === selectedFilter : true;
            return matchesSearch && matchesFilter;
        });

    // Уникальные значения для фильтров
    const filterOptions = currentPage === 'persons'
        ? Array.from(new Set(mockPersons.map(p => p.occupation)))
        : ['active', 'inactive'];

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden'
        }}>
            {/* Левая панель - навигация */}
            <div style={{
                width: '200px',
                backgroundColor: '#f0f0f0',
                padding: '20px',
                borderRight: '1px solid #ddd'
            }}>
                <h3 style={{ marginTop: 0 }}>Навигация</h3>
                <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                }}>
                    {[
                        { id: 'persons', label: 'Персоны' },
                        { id: 'groups', label: 'Группы' },
                        { id: 'reports', label: 'Отчёты' },
                        { id: 'settings', label: 'Настройки' }
                    ].map((item) => (
                        <li
                            key={item.id}
                            onClick={() => handleNavItemClick(item.id as PageType)}
                            style={{
                                padding: '10px 0',
                                borderBottom: '1px solid #ddd',
                                cursor: 'pointer',
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
            <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <h2 style={{ margin: 0 }}>
                    {currentPage === 'persons' ? 'Persons' : 'Groups'}
                </h2>

                {/* Фильтр */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '15px',
                    backgroundColor: '#f8f8f8',
                    borderRadius: '5px'
                }}>
                    <input
                        type="text"
                        placeholder={currentPage === 'persons' ? 'Поиск по ФИО...' : 'Поиск по названию...'}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        style={{
                            padding: '8px',
                            flex: 1,
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                        }}
                    />

                    <select
                        value={selectedFilter}
                        onChange={handleFilterChange}
                        style={{
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            minWidth: '150px'
                        }}
                    >
                        <option value="">
                            {currentPage === 'persons' ? 'Все профессии' : 'Все статусы'}
                        </option>
                        {filterOptions.map((option, i) => (
                            <option key={i} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Список элементов */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleItemSelect(item)}
                                style={{
                                    padding: '12px',
                                    textAlign: 'left',
                                    backgroundColor: selectedItem?.id === item.id ? '#e0e0e0' : 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {currentPage === 'persons'
                                    ? (item as Person).fullName
                                    : (item as Group).name}
                            </button>
                        ))
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            Ничего не найдено
                        </div>
                    )}
                </div>
            </div>









            {/* Правая панель - детали */}
            <div style={{
                width: '350px',
                padding: '20px',
                backgroundColor: '#f9f9f9',
                borderLeft: '1px solid #ddd',
                overflowY: 'auto'
            }}>
                {selectedItem ? (
                    <>
                        <h2 style={{ marginTop: 0 }}>
                            {currentPage === 'persons'
                                ? (selectedItem as Person).fullName
                                : (selectedItem as Group).name}
                        </h2>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            {currentPage === 'persons' ? (
                                <>
                                    {[
                                        { label: 'Возраст', value: (selectedItem as Person).age },
                                        { label: 'Профессия', value: (selectedItem as Person).occupation },
                                        { label: 'Email', value: (selectedItem as Person).email },
                                        { label: 'Телефон', value: (selectedItem as Person).phone },
                                        { label: 'Адрес', value: (selectedItem as Person).address }
                                    ].map((item, index) => (
                                        <div key={index} style={detailRowStyle}>
                                            <span style={{ fontWeight: 'bold' }}>{item.label}:</span>
                                            <span>{item.value}</span>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    {[
                                        { label: 'Участников', value: (selectedItem as Group).members },
                                        { label: 'Дата создания', value: (selectedItem as Group).createdDate },
                                        { label: 'Статус', value: (selectedItem as Group).status === 'active' ? 'Активна' : 'Неактивна' },
                                        { label: 'Руководитель', value: (selectedItem as Group).leader },
                                        { label: 'Описание', value: (selectedItem as Group).description }
                                    ].map((item, index) => (
                                        <div key={index} style={detailRowStyle}>
                                            <span style={{ fontWeight: 'bold' }}>{item.label}:</span>
                                            <span>{item.value}</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        {currentPage === 'persons'
                            ? 'Выберите персону для просмотра деталей'
                            : 'Выберите группу для просмотра деталей'}
                    </div>
                )}
            </div>
        </div>
    );
};

// Стиль для строк с деталями
const detailRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee'
};

export default App;