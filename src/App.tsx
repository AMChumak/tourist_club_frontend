import React, { useState, useEffect } from 'react';
import { CSSProperties } from 'react';
import axios from 'axios';


// Типы данных

interface PersonsList {
    page: number;
    total: number;
    persons: PersonShort[];
}

interface ChampionshipsList {
    page: number;
    total: number;
    championships: Championship[];
}

interface PersonShort {
    id: number;
    name: string;
    surname: string;
    patronymic: string;
}


interface PersonAttribute {
    id: number;
    attr: string;
    role: number;
    attr_type: number;
}

interface AttributeValue {
    attr_id: number;
    value: number | string | null;
}

interface CancelableRequest {
    abort: () => void;
}


type PageType = 'persons' | 'championships' | 'workouts' | 'tours';

// Основной компонент
const App: React.FC = () => {
    const [activeRequests, setActiveRequests] = useState<CancelableRequest[]>([]);
    const [currentPage, setCurrentPage] = useState<PageType>('persons');
    const [searchTerm, setSearchTerm] = useState('');
    const [persons, setPersons] = useState<PersonShort[]>([]);
    const [championships, setChampionships] = useState<Championship[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<PersonShort | null>(null);
    const [selectedSection, setSelectedSection] = useState<string>("1");
    const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Функция для добавления запроса в отслеживаемые
    const trackRequest = (request: CancelableRequest) => {
        setActiveRequests(prev => [...prev, request]);
        return request;
    };

    // Функция очистки всех активных запросов
    const cancelAllRequests = () => {
        activeRequests.forEach(req => req.abort());
        setActiveRequests([]);
    };

    useEffect(() => {
        return () => {
            cancelAllRequests();
        };
    }, []);

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
        cancelAllRequests();
        try {
            setIsLoading(true);
            setError(null);

            const controller = new AbortController();
            trackRequest({
                abort: () => controller.abort()
            });

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
            const response = await axios.get<PersonsList>(`http://localhost:8080${endpoint}?${params.toString()}`, {
                signal: controller.signal
            });

            // Обрабатываем ответ
            if (!Array.isArray(response.data.persons)) {
                throw new Error('Некорректный формат данных');
            }

            setPersons(response.data.persons);
        } catch (err) {
            if (!axios.isCancel(err)) {
                setError('Ошибка при выполнении поиска');
                console.error('Ошибка поиска:', err);
            }
            setPersons([]);
        } finally {
            setIsLoading(false);
        }
    };

    const onSearchTrainer = async (filters: {
        group: string;
        startDate: string;
        endDate: string;
    }) => {
        cancelAllRequests();
        try {
            setIsLoading(true);
            setError(null);

            const controller = new AbortController();
            trackRequest({
                abort: () => controller.abort()
            });

            // Определяем endpoint в зависимости от роли
            let endpoint = '/trainers/workout-filter';

            // Формируем query параметры
            const params = new URLSearchParams();

            // Основные параметры
            if (filters.group) params.append('group', filters.group);
            if (filters.startDate) params.append('from_date', filters.startDate);
            if (filters.endDate) params.append('to_date', filters.endDate);


            // Отправляем запрос
            const response = await axios.get<PersonsList>(`http://localhost:8080${endpoint}?${params.toString()}`, {
                signal: controller.signal
            });

            // Обрабатываем ответ
            if (!Array.isArray(response.data.persons)) {
                throw new Error('Некорректный формат данных');
            }

            return response.data.persons;
        } catch (err) {
            if (!axios.isCancel(err)) {
                setError('Ошибка при выполнении поиска');
                console.error('Ошибка поиска:', err);
            }
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    const onCalculateStrain = async (filters: {
        trainerId: string;
        startDate: string;
        endDate: string;
    }) => {
        cancelAllRequests();
        try {
            setIsLoading(true);
            setError(null);

            const controller = new AbortController();
            trackRequest({
                abort: () => controller.abort()
            });

            // Определяем endpoint в зависимости от роли
            let endpoint = '/workouts/strain';

            // Формируем query параметры
            const params = new URLSearchParams();

            // Основные параметры
            if (filters.trainerId) params.append('trainer', filters.trainerId);
            if (filters.startDate) params.append('from_date', filters.startDate);
            if (filters.endDate) params.append('to_date', filters.endDate);


            // Отправляем запрос
            const response = await axios.get<StrainResponse>(`http://localhost:8080${endpoint}?${params.toString()}`, {
                signal: controller.signal
            });

            return response.data;
        } catch (err) {
            if (!axios.isCancel(err)) {
                setError('Ошибка при выполнении поиска');
                console.error('Ошибка поиска:', err);
            }
            return null;
        } finally {
            setIsLoading(false);
        }
    };



    const updateSelectedSection = (value:string) => {
        setSelectedSection(value);
    }

    // Обработчики событий
    const handleNavItemClick = (page: PageType) => {
        setCurrentPage(page);
        setSearchTerm('');
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handlePersonSelect = (person: PersonShort) => {
        setSelectedPerson(person);
    };

    const handleRouteSelect = (route: number | null) => {
        setSelectedRoute(route);
    };


    // Вспомогательные функции
    const formatFullName = (person: PersonShort) => {
        return `${person.surname} ${person.name} ${person.patronymic}`;
    };

    const filteredPersons = persons.filter(person => {
        const fullName = formatFullName(person).toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    let centralPanel;

    if(currentPage === 'persons') {
        centralPanel = <ContentPanel
            isLoading={isLoading}
            error={error}
            persons={persons}
            filteredPersons={filteredPersons}
            selectedPerson={selectedPerson}
            searchTerm={searchTerm}
            onSearch={onSearch}
            updateSelectedSection={updateSelectedSection}
            onSearchChange={handleSearchChange}
            onPersonSelect={handlePersonSelect}
            formatFullName={formatFullName}
            cancelAllRequests={cancelAllRequests}
            trackRequest={trackRequest}
        />;
    } else if (currentPage === 'championships') {
        centralPanel = <ChampionshipsPanel
            isLoading={isLoading}
            error={error}
            cancelAllRequests={cancelAllRequests}
            trackRequest={trackRequest}
            />
    } else if (currentPage === 'workouts') {
        centralPanel = <TrainingsPanel
        isLoading={isLoading}
        error={error}
        selectedPerson = {selectedPerson}
        onPersonSelect = {handlePersonSelect}
        onSearchTrainer = {onSearchTrainer}
        onCalculateStrain = {onCalculateStrain}
        cancelAllRequests={cancelAllRequests}
        trackRequest={trackRequest}
        />
    } else if (currentPage === 'tours') {
        centralPanel = <ToursPanel
            isLoading={isLoading}
            error={error}
            selectedPerson = {selectedPerson}
            selectedRoute = {selectedRoute}
            onPersonSelect = {handlePersonSelect}
            onRouteSelect = {handleRouteSelect}
            cancelAllRequests={cancelAllRequests}
            trackRequest={trackRequest}
        />
    }

    return (
        <div style={appStyle}>
            <NavigationPanel
                currentPage={currentPage}
                onNavItemClick={handleNavItemClick}
            />

            {centralPanel}

            <DetailsPanel
                currentPage={currentPage}
                selectedPerson={selectedPerson}
                currentSection={selectedSection}
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
        { id: 'championships', label: 'Соревнования' },
        { id: 'workouts', label: 'Тренировки' },
        { id: 'tours', label: 'Путешествия' },
    ];

    return (
        <div style={navPanelStyle}>
            <h3 style={{ marginTop: 0 }}>Туристический клуб</h3>
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
    updateSelectedSection: (value: string) => void;
    selectedPerson: PersonShort | null;
    searchTerm: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPersonSelect: (person: PersonShort) => void;
    formatFullName: (person: PersonShort) => string;
    onSearch: (filters: any) => void;
    cancelAllRequests: () => void;
    trackRequest:(request: CancelableRequest)=>CancelableRequest;
}> = ({
          isLoading,
          error,
          persons,
          filteredPersons,
          updateSelectedSection,
          selectedPerson,
          searchTerm,
          onSearchChange,
          onPersonSelect,
          formatFullName,
          onSearch,
          cancelAllRequests,
          trackRequest
      }) => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        roles: [],
        sections: [],
        groups: []
    });
    const [filters, setFilters] = useState({
        role: '0',
        section: '-1',
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
        cancelAllRequests();
        try {
            setIsLoadingFilters(true);

            const controller = new AbortController();
            trackRequest({
                abort: () => controller.abort()
            });

            const [rolesRes, sectionsRes, groupsRes] = await Promise.all([
                axios.get<PersonRole[]>('http://localhost:8080/roles/list', { signal: controller.signal }),
                axios.get<Section[]>('http://localhost:8080/sections/list', { signal: controller.signal }),
                axios.get<Group[]>('http://localhost:8080/groups/list', { signal: controller.signal })
            ]);

            setFilterOptions({
                roles: rolesRes.data,
                sections: sectionsRes.data,
                groups: groupsRes.data,
            });

        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка загрузки фильтров:', err);
            }
        } finally {
            setIsLoadingFilters(false);
        }
    };

    useEffect(() => {
        loadFilterOptions();
    }, []);

    const handleFilterChange = (name: string, value: string) => {
        //todo
        if (name === "section") {
            updateSelectedSection(value);
        }
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

const DetailsPanel: React.FC<{
    currentPage: PageType;
    selectedPerson: PersonShort | null;
    isLoading: boolean;
    error: string | null;
    formatFullName: (person: PersonShort) => string;
    currentSection: string; // Добавляем текущую секцию из фильтров
}> = ({ currentPage, selectedPerson, isLoading, error, formatFullName, currentSection }) => {
    const [attributes, setAttributes] = useState<PersonAttribute[]>([]);
    const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
    const [personRole, setPersonRole] = useState<number | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    // Загрузка данных при выборе персоны
    useEffect(() => {

        const controller = new AbortController();
        let isMounted = true;

        const fetchPersonDetails = async () => {
            if (!selectedPerson || !currentSection) return;

            try {
                setDetailsLoading(true);
                setDetailsError(null);
                setAttributes([]);
                setAttributeValues([]);
                setPersonRole(null);

                // 1. Получаем роль персоны
                const roleResponse = await axios.get<{ role: number | null }>(
                    `http://localhost:8080/persons/roles?person=${selectedPerson.id.toString()}&section=${currentSection}`,
                    { signal: controller.signal }
                );
                if (!isMounted) return;
                if (roleResponse.data === null) {
                    setPersonRole(-1);
                } else {
                    setPersonRole(roleResponse.data.role);
                }


                // 2. Получаем список атрибутов
                const attributesResponse = await axios.get<PersonAttribute[]>(
                    'http://localhost:8080/person-attributes/list',
                    { signal: controller.signal }
                );
                if (!isMounted) return;
                setAttributes(attributesResponse.data);

                // 3. Фильтруем атрибуты по роли и загружаем значения
                const filteredAttributes = attributesResponse.data.filter(
                    attr => attr.role === -1 || attr.role === roleResponse.data.role
                );
                console.log("i am alive! ", filteredAttributes);

                // 4. Загружаем значения для каждого атрибута
                const valuesPromises = filteredAttributes.map(async attr => {
                    try {
                        let value: number | string | null = null;

                        switch (attr.attr_type) {
                            case 1: // int
                                const intRes = await axios.get<{ value: number | null }>(
                                    `http://localhost:8080/persons/attribute/int?person=${selectedPerson.id}&attribute=${attr.id}`,
                                    { signal: controller.signal }
                                );
                                if (intRes.data === null) {
                                    value = null;
                                } else {
                                    // @ts-ignore
                                    value = intRes.data;
                                    console.log("writed in value ", value);
                                }
                                break;

                            case 2: // float
                                const floatRes = await axios.get<{ value: number | null }>(
                                    `http://localhost:8080/persons/attribute/float?person=${selectedPerson.id}&attribute=${attr.id}`,
                                    { signal: controller.signal }
                                );

                                if (floatRes.data === null) {
                                    value = null;
                                } else {
                                    // @ts-ignore
                                    value = floatRes.data;
                                }
                                break;

                            case 3: // string
                                const stringRes = await axios.get<{ value: string | null }>(
                                    `http://localhost:8080/persons/attribute/string?person=${selectedPerson.id}&attribute=${attr.id}`,
                                    { signal: controller.signal }
                                );
                                if (stringRes.data === null) {
                                    value = null;
                                } else {
                                    // @ts-ignore
                                    value = stringRes.data;
                                }
                                break;

                            case 4: // date
                                const dateRes = await axios.get<{ value: string | null }>(
                                    `http://localhost:8080/persons/attribute/date?person=${selectedPerson.id}&attribute=${attr.id}`,
                                    { signal: controller.signal }
                                );
                                if (dateRes.data === null) {
                                    value = null;
                                } else {
                                    // @ts-ignore
                                    value = dateRes.data;
                                }
                                break;
                        }
                        return { attr_id: attr.id, value };
                    } catch (err) {
                        console.error(`Ошибка загрузки атрибута ${attr.id}:`, err);
                        return { attr_id: attr.id, value: null };
                    }
                });

                const values = await Promise.all(valuesPromises);

                setAttributeValues(values);
            } catch (err) {
                if (!isMounted) return;
                if (axios.isCancel(err)) {
                    console.log('Request canceled:', err.message);
                } else {
                    setDetailsError('Ошибка загрузки деталей персоны');
                    console.error('Ошибка загрузки:', err);
                }
            } finally {
                if (isMounted) {
                    setDetailsLoading(false);
                }
            }
        };

        fetchPersonDetails();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [selectedPerson, currentSection]);


    const formatValue = (value: number | string | null, attr_id: number) => {

        let result: number | string | null;
        result = value;

        if (attr_id === 1) {
            if (value === 0) {
                result = "женский";
            } else {
                result = "мужской";
            }
        }

        return result;
    }

    const formatRole = (role: number | null) => {
        if (role === null) {
            return "Нет роли в секции";
        }
        switch (role){
            case 0: return "любитель";
            case 1: return "спортсмен";
            case 2: return "тренер";
            case 3: return "менеджер";
        }
        return "Нет роли в секции";
    }

    const renderPersonDetails = () => {
        if (!selectedPerson) {
            return (
                <div style={messageStyle}>
                    Выберите персону для просмотра деталей
                </div>
            );
        }

        if (isLoading || detailsLoading) {
            return <div style={messageStyle}>Загрузка деталей...</div>;
        }

        if (error || detailsError) {
            return <div style={{ ...messageStyle, color: 'red' }}>{error || detailsError}</div>;
        }

        // Формируем список атрибутов для отображения
        const displayAttributes = attributes
            .filter(attr => personRole === null || attr.role === -1 || attr.role === personRole)
            .map(attr => {
                const valueObj = attributeValues.find(v => v.attr_id === attr.id);

                return {
                    name: attr.attr,
                    value: valueObj ? formatValue(valueObj.value, attr.id) : null,
                    type: attr.attr_type
                };
            });

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

                    {personRole !== null && (
                        <div style={propertyRowStyle}>
                            <span style={propertyLabelStyle}>Роль в секции:</span>
                            <span>{formatRole(personRole)}</span>
                        </div>
                    )}

                    {displayAttributes.map((attr, index) => (
                        <div key={index} style={propertyRowStyle}>
                            <span style={propertyLabelStyle}>{attr.name}:</span>
                            <span>
                {attr.value !== null ? (
                    attr.value
                ) : (
                    <span style={{ color: '#999' }}>не указано</span>
                )}
              </span>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    // Вспомогательная функция для форматирования даты
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    return (
        <div style={detailsPanelStyle}>
            {renderPersonDetails()}
        </div>
    );
};

interface Championship {
    id: number;
    title: string;
    date: string;
}

interface ChampionshipsResponse {
    page: number;
    total: number;
    championships: Championship[];
}

const ChampionshipsPanel: React.FC<{
    isLoading: boolean;
    error: string | null;
    cancelAllRequests: () => void;
    trackRequest: (request: CancelableRequest) => CancelableRequest;
}> = ({ isLoading, error, cancelAllRequests, trackRequest }) => {
    const [championships, setChampionships] = useState<Championship[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>("");

    // Загрузка списка секций
    const loadSections = async () => {
        cancelAllRequests();
        try {
            const controller = new AbortController();
            trackRequest({
                abort: () => controller.abort()
            });

            const response = await axios.get<Section[]>(
                'http://localhost:8080/sections/list',
                { signal: controller.signal }
            );
            setSections(response.data);
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка загрузки секций:', err);
            }
        }
    };

    // Загрузка соревнований
    const loadChampionships = async (sectionId: string) => {
        cancelAllRequests();
        try {
            const controller = new AbortController();
            trackRequest({
                abort: () => controller.abort()
            });

            const params = new URLSearchParams();
            if (sectionId) {
                params.append('section', sectionId);
            }

            const response = await axios.get<ChampionshipsResponse>(
                `http://localhost:8080/championships/filter?${params.toString()}`,
                { signal: controller.signal }
            );

            setChampionships(response.data.championships);
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка загрузки соревнований:', err);
            }
        }
    };

    useEffect(() => {
        loadSections();
    }, []);

    const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sectionId = e.target.value;
        setSelectedSection(sectionId);
        loadChampionships(sectionId);
    };

    const renderChampionshipsList = () => {
        if (isLoading && championships.length === 0) {
            return <div style={messageStyle}>Загрузка...</div>;
        }

        if (error) {
            return <div style={{ ...messageStyle, color: 'red' }}>{error}</div>;
        }

        if (championships.length === 0) {
            return <div style={messageStyle}>Соревнования не найдены</div>;
        }

        return (
            <div style={listContainerStyle}>
                {championships.map(championship => (
                    <div
                        key={championship.id}
                        style={{
                            ...listItemStyle,
                            padding: '12px',
                            marginBottom: '8px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold' }}>{championship.title}</div>
                        <div style={{ color: '#666' }}>
                            {new Date(championship.date).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={contentPanelStyle}>
            <h2 style={{ margin: 0 }}>Соревнования</h2>

            <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
                alignItems: 'center'
            }}>
                <select
                    value={selectedSection}
                    onChange={handleSectionChange}
                    style={{
                        padding: '8px',
                        minWidth: '200px',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                    }}
                >
                    <option value="">Все секции</option>
                    {sections.map(section => (
                        <option key={section.id} value={section.id}>
                            {section.title}
                        </option>
                    ))}
                </select>
            </div>

            {renderChampionshipsList()}
        </div>
    );
};


interface Training {
    id: number;
    trainerName: string;
    date: string;
    duration: string;
}

interface StrainItem {
    type: string;
    duration: string;
}

interface StrainResponse {
    page: number;
    total: number;
    strainList: StrainItem[];
}

const TrainingsPanel: React.FC<{
    isLoading: boolean;
    error: string | null;
    selectedPerson: PersonShort | null;
    onPersonSelect: (person: PersonShort) => void;
    onSearchTrainer: (filters: {
        group: string;
        startDate: string;
        endDate: string;
    }) => Promise<PersonShort[]>;
    onCalculateStrain: (filters: {
        trainerId: string;
        startDate: string;
        endDate: string;
    }) => Promise<StrainResponse | null>;
    cancelAllRequests: () => void;
    trackRequest: (request: CancelableRequest) => CancelableRequest;
}> = ({
          isLoading,
          error,
          selectedPerson,
          onPersonSelect,
          onSearchTrainer,
          onCalculateStrain,
          cancelAllRequests,
          trackRequest
      }) => {
    const [mode, setMode] = useState<'trainer' | 'strain'>('trainer');
    const [groups, setGroups] = useState<Group[]>([]);
    const [trainings, setTrainings] = useState<PersonShort[]>([]);
    const [strainData, setStrainData] = useState<StrainItem[]>([]);

    // Фильтры для режима тренера
    const [trainerFilters, setTrainerFilters] = useState({
        group: '',
        startDate: '',
        endDate: ''
    });

    // Фильтры для режима нагрузки
    const [strainFilters, setStrainFilters] = useState({
        trainerId: '',
        startDate: '',
        endDate: ''
    });

    // Загрузка групп
    const loadGroups = async () => {
        cancelAllRequests();
        try {
            const controller = new AbortController();
            trackRequest({
                abort: () => controller.abort()
            });

            const response = await axios.get<Group[]>(
                'http://localhost:8080/groups/list',
                { signal: controller.signal }
            );
            setGroups(response.data);
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка загрузки групп:', err);
            }
        }
    };

    // Поиск тренеров
    const handleTrainerSearch = async () => {
        if (!trainerFilters.group || !trainerFilters.startDate || !trainerFilters.endDate) {
            return;
        }

        try {
            cancelAllRequests();
            const controller = new AbortController();
            trackRequest({
                abort: () => controller.abort()
            });

            const result = await onSearchTrainer({
                group: trainerFilters.group,
                startDate: trainerFilters.startDate,
                endDate: trainerFilters.endDate
            });
            setTrainings(result);
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка поиска тренеров:', err);
            }
        }
    };

    // Расчет нагрузки
    const handleStrainCalculate = async () => {
        if (!strainFilters.trainerId || !strainFilters.startDate || !strainFilters.endDate) {
            return;
        }

        try {
            cancelAllRequests();
            const controller = new AbortController();
            trackRequest({
                abort: () => controller.abort()
            });

            const result = await onCalculateStrain({
                trainerId: strainFilters.trainerId,
                startDate: strainFilters.startDate,
                endDate: strainFilters.endDate
            });
            if (result === null) {
                setStrainData([])
            } else {
                setStrainData(result.strainList);
            }
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка расчета нагрузки:', err);
            }
        }
    };

    useEffect(() => {
        loadGroups();
    }, []);

    const renderTrainerFilter = () => (
        <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <select
                    value={trainerFilters.group}
                    onChange={(e) => setTrainerFilters({...trainerFilters, group: e.target.value})}
                    style={{ padding: '8px', minWidth: '200px' }}
                >
                    <option value="">Выберите группу</option>
                    {groups.map(group => (
                        <option key={group.id} value={group.group_number}>{group.group_number}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={trainerFilters.startDate}
                    onChange={(e) => setTrainerFilters({...trainerFilters, startDate: e.target.value})}
                    style={{ padding: '8px' }}
                    placeholder="Начало периода"
                />

                <input
                    type="date"
                    value={trainerFilters.endDate}
                    onChange={(e) => setTrainerFilters({...trainerFilters, endDate: e.target.value})}
                    style={{ padding: '8px' }}
                    placeholder="Конец периода"
                />
            </div>

            <button
                onClick={handleTrainerSearch}
                style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
            >
                Найти тренеров
            </button>
        </div>
    );

    const renderStrainCalculator = () => (
        <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    value={strainFilters.trainerId}
                    onChange={(e) => setStrainFilters({...strainFilters, trainerId: e.target.value})}
                    style={{ padding: '8px', minWidth: '200px' }}
                    placeholder="ID тренера"
                />

                <input
                    type="date"
                    value={strainFilters.startDate}
                    onChange={(e) => setStrainFilters({...strainFilters, startDate: e.target.value})}
                    style={{ padding: '8px' }}
                    placeholder="Начало периода"
                />

                <input
                    type="date"
                    value={strainFilters.endDate}
                    onChange={(e) => setStrainFilters({...strainFilters, endDate: e.target.value})}
                    style={{ padding: '8px' }}
                    placeholder="Конец периода"
                />
            </div>

            <button
                onClick={handleStrainCalculate}
                style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
            >
                Рассчитать нагрузку
            </button>
        </div>
    );

    const renderTrainersList = () => {
        if (isLoading && trainings.length === 0) {
            return <div style={messageStyle}>Загрузка...</div>;
        }

        if (error) {
            return <div style={{ ...messageStyle, color: 'red' }}>{error}</div>;
        }

        if (trainings.length === 0) {
            return <div style={messageStyle}>Тренеры не найдены</div>;
        }

        return (
            <div style={listContainerStyle}>
                {trainings.map(trainer => (
                    <button
                        key={trainer.id}
                        onClick={() => onPersonSelect(trainer)}
                        style={{
                            ...listItemStyle,
                            backgroundColor: selectedPerson?.id === trainer.id ? '#e0e0e0' : 'white',
                        }}
                    >
                        {`${trainer.surname} ${trainer.name} ${trainer.patronymic}`}
                    </button>
                ))}
            </div>
        );
    };

    const renderStrainList = () => {
        if (isLoading && strainData.length === 0) {
            return <div style={messageStyle}>Загрузка...</div>;
        }

        if (error) {
            return <div style={{ ...messageStyle, color: 'red' }}>{error}</div>;
        }

        if (strainData.length === 0) {
            return <div style={messageStyle}>Данные по нагрузке отсутствуют</div>;
        }

        return (
            <div style={listContainerStyle}>
                {strainData.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            ...listItemStyle,
                            padding: '12px',
                            marginBottom: '8px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold' }}>{item.type}</div>
                        <div style={{ color: '#666' }}>Длительность: {item.duration}</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={contentPanelStyle}>
            <h2 style={{ margin: 0 }}>Тренировки</h2>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => setMode('trainer')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: mode === 'trainer' ? '#4CAF50' : '#f0f0f0',
                        color: mode === 'trainer' ? 'white' : 'black',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    Фильтр тренеров
                </button>
                <button
                    onClick={() => setMode('strain')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: mode === 'strain' ? '#4CAF50' : '#f0f0f0',
                        color: mode === 'strain' ? 'white' : 'black',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    Калькулятор нагрузки
                </button>
            </div>

            {mode === 'trainer' ? renderTrainerFilter() : renderStrainCalculator()}

            {mode === 'trainer' ? renderTrainersList() : renderStrainList()}
        </div>
    );
};



interface RouteType {
    id: number;
    type: string;
}

interface ToursPanelProps {
    isLoading: boolean;
    error: string | null;
    selectedPerson: PersonShort | null;
    selectedRoute: number | null;
    onPersonSelect: (person: PersonShort) => void;
    onRouteSelect: (routeId: number) => void;
    cancelAllRequests: () => void;
    trackRequest: (request: { abort: () => void }) => void;
}

const ToursPanel: React.FC<ToursPanelProps> = ({
                                                   isLoading,
                                                   error,
                                                   selectedPerson,
                                                   selectedRoute,
                                                   onPersonSelect,
                                                   onRouteSelect,
                                                   cancelAllRequests,
                                                   trackRequest
                                               }) => {
    const [mode, setMode] = useState<
        'tourists-routes' | 'routes-groups' | 'routes-geo' |
        'tourists-types' | 'instructors' | 'tourists-instructors' |
        'tourists-completed'
    >('tourists-routes');

    // Данные для фильтров
    const [toursList, setToursList] = useState<number[]>([]);
    const [routesList, setRoutesList] = useState<number[]>([]);
    const [placesList, setPlacesList] = useState<number[]>([]);
    const [routeTypes, setRouteTypes] = useState<RouteType[]>([]);
    const [sections, setSections] = useState<string[]>([]);
    const [groups, setGroups] = useState<string[]>([]);

    // Фильтры для разных режимов
    const [touristsRoutesFilters, setTouristsRoutesFilters] = useState({
        section: '',
        group: '',
        cntTours: 0,
        tourId: '',
        tourTime: '',
        routeId: '',
        placeId: ''
    });

    const [routesGroupsFilters, setRoutesGroupsFilters] = useState({
        section: '',
        dateFrom: '',
        dateTo: '',
        instructor: '',
        groupCnt: 0
    });

    const [routesGeoFilters, setRoutesGeoFilters] = useState({
        place: '',
        length: 0,
        difficulty: '1'
    });

    const [touristsTypesFilters, setTouristsTypesFilters] = useState({
        typeId: '',
        difficulty: '1'
    });

    const [instructorsFilters, setInstructorsFilters] = useState({
        role: '1',
        routeType: '',
        routeDifficulty: '1',
        cntTours: 0,
        tourId: '',
        placeId: ''
    });

    const [touristsInstructorsFilters, setTouristsInstructorsFilters] = useState({
        section: '',
        group: ''
    });

    const [touristsCompletedFilters, setTouristsCompletedFilters] = useState({
        allRoutes: false,
        section: '',
        group: '',
        routeIds: ''
    });

    // Результаты поиска
    const [persons, setPersons] = useState<PersonShort[]>([]);
    const [routeIds, setRouteIds] = useState<number[]>([]);

    // Загрузка данных для фильтров
    useEffect(() => {
        const loadInitialData = async () => {
            cancelAllRequests();
            try {
                const controller = new AbortController();
                trackRequest({ abort: () => controller.abort() });

                const [toursRes, routesRes, placesRes, typesRes, sectionsRes, groupsRes] = await Promise.all([
                    axios.get<number[]>('http://localhost:8080/tours/list', { signal: controller.signal }),
                    axios.get<number[]>('http://localhost:8080/routes/list', { signal: controller.signal }),
                    axios.get<number[]>('http://localhost:8080/places/list', { signal: controller.signal }),
                    axios.get<RouteType[]>('http://localhost:8080/routes/types', { signal: controller.signal }),
                    axios.get<string[]>('http://localhost:8080/sections/list', { signal: controller.signal }),
                    axios.get<string[]>('http://localhost:8080/groups/list', { signal: controller.signal })
                ]);

                setToursList(toursRes.data);
                setRoutesList(routesRes.data);
                setPlacesList(placesRes.data);
                setRouteTypes(typesRes.data);
                setSections(sectionsRes.data);
                setGroups(groupsRes.data);
            } catch (err) {
                if (!axios.isCancel(err)) {
                    console.error('Ошибка загрузки данных:', err);
                }
            }
        };

        loadInitialData();
    }, []);

    // Обработчики поиска для разных режимов
    const handleTouristsRoutesSearch = async () => {
        try {
            cancelAllRequests();
            const controller = new AbortController();
            trackRequest({ abort: () => controller.abort() });

            const params = new URLSearchParams();
            if (touristsRoutesFilters.section) params.append('section', touristsRoutesFilters.section);
            if (touristsRoutesFilters.group) params.append('group', touristsRoutesFilters.group);
            params.append('cnt_tours', touristsRoutesFilters.cntTours.toString());
            if (touristsRoutesFilters.tourId) params.append('tour_id', touristsRoutesFilters.tourId);
            if (touristsRoutesFilters.tourTime) params.append('tour_time', touristsRoutesFilters.tourTime);
            if (touristsRoutesFilters.routeId) params.append('route_id', touristsRoutesFilters.routeId);
            if (touristsRoutesFilters.placeId) params.append('place_id', touristsRoutesFilters.placeId);

            const response = await axios.get<PersonShort[]>(
                `http://localhost:8080/tourists/tour-filter?${params.toString()}`,
                { signal: controller.signal }
            );

            setPersons(response.data);
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка поиска туристов:', err);
            }
        }
    };

    const handleRoutesGroupsSearch = async () => {
        try {
            cancelAllRequests();
            const controller = new AbortController();
            trackRequest({ abort: () => controller.abort() });

            const params = new URLSearchParams();
            if (routesGroupsFilters.section) params.append('section', routesGroupsFilters.section);
            if (routesGroupsFilters.dateFrom) params.append('date_from', routesGroupsFilters.dateFrom);
            if (routesGroupsFilters.dateTo) params.append('date_to', routesGroupsFilters.dateTo);
            if (routesGroupsFilters.instructor) params.append('instructor', routesGroupsFilters.instructor);
            params.append('group_cnt', routesGroupsFilters.groupCnt.toString());

            const response = await axios.get<{ routeIds: number[] }>(
                `http://localhost:8080/routes/filter?${params.toString()}`,
                { signal: controller.signal }
            );

            setRouteIds(response.data.routeIds);
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка поиска маршрутов:', err);
            }
        }
    };

    const handleRoutesGeoSearch = async () => {
        try {
            cancelAllRequests();
            const controller = new AbortController();
            trackRequest({ abort: () => controller.abort() });

            const params = new URLSearchParams();
            if (routesGeoFilters.place) params.append('place', routesGeoFilters.place);
            params.append('length', routesGeoFilters.length.toString());
            params.append('difficulty', routesGeoFilters.difficulty);

            const response = await axios.get<{ routeIds: number[] }>(
                `http://localhost:8080/routes/geofilter?${params.toString()}`,
                { signal: controller.signal }
            );

            setRouteIds(response.data.routeIds);
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка геопоиска маршрутов:', err);
            }
        }
    };

    const handleTouristsTypesSearch = async () => {
        try {
            cancelAllRequests();
            const controller = new AbortController();
            trackRequest({ abort: () => controller.abort() });

            const params = new URLSearchParams();
            if (touristsTypesFilters.typeId) params.append('type_id', touristsTypesFilters.typeId);
            params.append('difficulty', touristsTypesFilters.difficulty);

            const response = await axios.get<PersonShort[]>(
                `http://localhost:8080/tourists/route-filter?${params.toString()}`,
                { signal: controller.signal }
            );

            setPersons(response.data);
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка поиска по типам:', err);
            }
        }
    };

    const handleInstructorsSearch = async () => {
        try {
            cancelAllRequests();
            const controller = new AbortController();
            trackRequest({ abort: () => controller.abort() });

            const params = new URLSearchParams();
            params.append('role', instructorsFilters.role);
            if (instructorsFilters.routeType) params.append('type', instructorsFilters.routeType);
            params.append('difficulty', instructorsFilters.routeDifficulty);
            params.append('cnt_tours', instructorsFilters.cntTours.toString());
            if (instructorsFilters.tourId) params.append('tour_id', instructorsFilters.tourId);
            if (instructorsFilters.placeId) params.append('place_id', instructorsFilters.placeId);

            const response = await axios.get<PersonShort[]>(
                `http://localhost:8080/instructors/filter?${params.toString()}`,
                { signal: controller.signal }
            );

            setPersons(response.data);
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка поиска инструкторов:', err);
            }
        }
    };

    const handleTouristsInstructorsSearch = async () => {
        try {
            cancelAllRequests();
            const controller = new AbortController();
            trackRequest({ abort: () => controller.abort() });

            const params = new URLSearchParams();
            if (touristsInstructorsFilters.section) params.append('section', touristsInstructorsFilters.section);
            if (touristsInstructorsFilters.group) params.append('group', touristsInstructorsFilters.group);

            const response = await axios.get<PersonShort[]>(
                `http://localhost:8080/tourists/trainer-instructor?${params.toString()}`,
                { signal: controller.signal }
            );

            setPersons(response.data);
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка поиска туристов-инструкторов:', err);
            }
        }
    };

    const handleTouristsCompletedSearch = async () => {
        try {
            cancelAllRequests();
            const controller = new AbortController();
            trackRequest({ abort: () => controller.abort() });

            if (touristsCompletedFilters.allRoutes) {
                const params = new URLSearchParams();
                if (touristsCompletedFilters.section) params.append('section', touristsCompletedFilters.section);
                if (touristsCompletedFilters.group) params.append('group', touristsCompletedFilters.group);

                const response = await axios.get<PersonShort[]>(
                    `http://localhost:8080/tourists/completed-all?${params.toString()}`,
                    { signal: controller.signal }
                );

                setPersons(response.data);
            } else {
                const routeIdsArray = touristsCompletedFilters.routeIds
                    .split(',')
                    .map(id => parseInt(id.trim()))
                    .filter(id => !isNaN(id));

                const response = await axios.post<PersonShort[]>(
                    `http://localhost:8080/tourists/completed?section=${touristsCompletedFilters.section}&group=${touristsCompletedFilters.group}`,
                    routeIdsArray,
                    { signal: controller.signal }
                );

                setPersons(response.data);
            }
        } catch (err) {
            if (!axios.isCancel(err)) {
                console.error('Ошибка поиска выполненных маршрутов:', err);
            }
        }
    };

    // Рендер фильтров для разных режимов
    const renderTouristsRoutesFilter = () => (
        <div style={filterContainerStyle}>
            <div style={filterRowStyle}>
                <select
                    value={touristsRoutesFilters.section}
                    onChange={(e) => setTouristsRoutesFilters({...touristsRoutesFilters, section: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите секцию</option>
                    {sections.map(section => (
                        <option key={section} value={section}>{section}</option>
                    ))}
                </select>

                <select
                    value={touristsRoutesFilters.group}
                    onChange={(e) => setTouristsRoutesFilters({...touristsRoutesFilters, group: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите группу</option>
                    {groups.map(group => (
                        <option key={group} value={group}>{group}</option>
                    ))}
                </select>
            </div>

            <div style={filterRowStyle}>
                <input
                    type="number"
                    min="0"
                    value={touristsRoutesFilters.cntTours}
                    onChange={(e) => setTouristsRoutesFilters({...touristsRoutesFilters, cntTours: parseInt(e.target.value) || 0})}
                    style={inputStyle}
                    placeholder="Число маршрутов"
                />

                <select
                    value={touristsRoutesFilters.tourId}
                    onChange={(e) => setTouristsRoutesFilters({...touristsRoutesFilters, tourId: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите тур</option>
                    {toursList.map(tourId => (
                        <option key={tourId} value={tourId.toString()}>{tourId}</option>
                    ))}
                </select>
            </div>

            <div style={filterRowStyle}>
                <input
                    type="date"
                    value={touristsRoutesFilters.tourTime}
                    onChange={(e) => setTouristsRoutesFilters({...touristsRoutesFilters, tourTime: e.target.value})}
                    style={inputStyle}
                    placeholder="Дата маршрута"
                />

                <select
                    value={touristsRoutesFilters.routeId}
                    onChange={(e) => setTouristsRoutesFilters({...touristsRoutesFilters, routeId: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите маршрут</option>
                    {routesList.map(routeId => (
                        <option key={routeId} value={routeId.toString()}>{routeId}</option>
                    ))}
                </select>
            </div>

            <div style={filterRowStyle}>
                <select
                    value={touristsRoutesFilters.placeId}
                    onChange={(e) => setTouristsRoutesFilters({...touristsRoutesFilters, placeId: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите место</option>
                    {placesList.map(placeId => (
                        <option key={placeId} value={placeId.toString()}>{placeId}</option>
                    ))}
                </select>
            </div>

            <button onClick={handleTouristsRoutesSearch} style={buttonStyle}>
                Найти туристов
            </button>
        </div>
    );

    const renderRoutesGroupsFilter = () => (
        <div style={filterContainerStyle}>
            <div style={filterRowStyle}>
                <select
                    value={routesGroupsFilters.section}
                    onChange={(e) => setRoutesGroupsFilters({...routesGroupsFilters, section: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите секцию</option>
                    {sections.map(section => (
                        <option key={section} value={section}>{section}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={routesGroupsFilters.dateFrom}
                    onChange={(e) => setRoutesGroupsFilters({...routesGroupsFilters, dateFrom: e.target.value})}
                    style={inputStyle}
                    placeholder="Начало периода"
                />

                <input
                    type="date"
                    value={routesGroupsFilters.dateTo}
                    onChange={(e) => setRoutesGroupsFilters({...routesGroupsFilters, dateTo: e.target.value})}
                    style={inputStyle}
                    placeholder="Конец периода"
                />
            </div>

            <div style={filterRowStyle}>
                <input
                    type="text"
                    value={routesGroupsFilters.instructor}
                    onChange={(e) => setRoutesGroupsFilters({...routesGroupsFilters, instructor: e.target.value})}
                    style={inputStyle}
                    placeholder="ID инструктора"
                />

                <input
                    type="number"
                    min="0"
                    value={routesGroupsFilters.groupCnt}
                    onChange={(e) => setRoutesGroupsFilters({...routesGroupsFilters, groupCnt: parseInt(e.target.value) || 0})}
                    style={inputStyle}
                    placeholder="Число групп"
                />
            </div>

            <button onClick={handleRoutesGroupsSearch} style={buttonStyle}>
                Найти маршруты
            </button>
        </div>
    );

    const renderRoutesGeoFilter = () => (
        <div style={filterContainerStyle}>
            <div style={filterRowStyle}>
                <select
                    value={routesGeoFilters.place}
                    onChange={(e) => setRoutesGeoFilters({...routesGeoFilters, place: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите место</option>
                    {placesList.map(placeId => (
                        <option key={placeId} value={placeId.toString()}>{placeId}</option>
                    ))}
                </select>

                <input
                    type="number"
                    min="0"
                    value={routesGeoFilters.length}
                    onChange={(e) => setRoutesGeoFilters({...routesGeoFilters, length: parseInt(e.target.value) || 0})}
                    style={inputStyle}
                    placeholder="Длина маршрута"
                />

                <select
                    value={routesGeoFilters.difficulty}
                    onChange={(e) => setRoutesGeoFilters({...routesGeoFilters, difficulty: e.target.value})}
                    style={selectStyle}
                >
                    <option value="1">Легкий</option>
                    <option value="5">Нормальный</option>
                    <option value="10">Сложный</option>
                </select>
            </div>

            <button onClick={handleRoutesGeoSearch} style={buttonStyle}>
                Найти маршруты
            </button>
        </div>
    );

    const renderTouristsTypesFilter = () => (
        <div style={filterContainerStyle}>
            <div style={filterRowStyle}>
                <select
                    value={touristsTypesFilters.typeId}
                    onChange={(e) => setTouristsTypesFilters({...touristsTypesFilters, typeId: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите тип</option>
                    {routeTypes.map(type => (
                        <option key={type.id} value={type.id.toString()}>{type.type}</option>
                    ))}
                </select>

                <select
                    value={touristsTypesFilters.difficulty}
                    onChange={(e) => setTouristsTypesFilters({...touristsTypesFilters, difficulty: e.target.value})}
                    style={selectStyle}
                >
                    <option value="1">Легкий</option>
                    <option value="5">Нормальный</option>
                    <option value="10">Сложный</option>
                </select>
            </div>

            <button onClick={handleTouristsTypesSearch} style={buttonStyle}>
                Найти туристов
            </button>
        </div>
    );

    const renderInstructorsFilter = () => (
        <div style={filterContainerStyle}>
            <div style={filterRowStyle}>
                <select
                    value={instructorsFilters.role}
                    onChange={(e) => setInstructorsFilters({...instructorsFilters, role: e.target.value})}
                    style={selectStyle}
                >
                    <option value="1">Спортсмен</option>
                    <option value="2">Тренер</option>
                </select>

                <select
                    value={instructorsFilters.routeType}
                    onChange={(e) => setInstructorsFilters({...instructorsFilters, routeType: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите тип</option>
                    {routeTypes.map(type => (
                        <option key={type.id} value={type.id.toString()}>{type.type}</option>
                    ))}
                </select>

                <select
                    value={instructorsFilters.routeDifficulty}
                    onChange={(e) => setInstructorsFilters({...instructorsFilters, routeDifficulty: e.target.value})}
                    style={selectStyle}
                >
                    <option value="1">Легкий</option>
                    <option value="5">Нормальный</option>
                    <option value="10">Сложный</option>
                </select>
            </div>

            <div style={filterRowStyle}>
                <input
                    type="number"
                    min="0"
                    value={instructorsFilters.cntTours}
                    onChange={(e) => setInstructorsFilters({...instructorsFilters, cntTours: parseInt(e.target.value) || 0})}
                    style={inputStyle}
                    placeholder="Число туров"
                />

                <select
                    value={instructorsFilters.tourId}
                    onChange={(e) => setInstructorsFilters({...instructorsFilters, tourId: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите тур</option>
                    {toursList.map(tourId => (
                        <option key={tourId} value={tourId.toString()}>{tourId}</option>
                    ))}
                </select>
            </div>

            <div style={filterRowStyle}>
                <select
                    value={instructorsFilters.placeId}
                    onChange={(e) => setInstructorsFilters({...instructorsFilters, placeId: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите место</option>
                    {placesList.map(placeId => (
                        <option key={placeId} value={placeId.toString()}>{placeId}</option>
                    ))}
                </select>
            </div>

            <button onClick={handleInstructorsSearch} style={buttonStyle}>
                Найти инструкторов
            </button>
        </div>
    );

    const renderTouristsInstructorsFilter = () => (
        <div style={filterContainerStyle}>
            <div style={filterRowStyle}>
                <select
                    value={touristsInstructorsFilters.section}
                    onChange={(e) => setTouristsInstructorsFilters({...touristsInstructorsFilters, section: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите секцию</option>
                    {sections.map(section => (
                        <option key={section} value={section}>{section}</option>
                    ))}
                </select>

                <select
                    value={touristsInstructorsFilters.group}
                    onChange={(e) => setTouristsInstructorsFilters({...touristsInstructorsFilters, group: e.target.value})}
                    style={selectStyle}
                >
                    <option value="">Выберите группу</option>
                    {groups.map(group => (
                        <option key={group} value={group}>{group}</option>
                    ))}
                </select>
            </div>

            <button onClick={handleTouristsInstructorsSearch} style={buttonStyle}>
                Найти туристов-инструкторов
            </button>
        </div>
    );

    const renderTouristsCompletedFilter = () => (
        <div style={filterContainerStyle}>
            <div style={filterRowStyle}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        checked={touristsCompletedFilters.allRoutes}
                        onChange={(e) => setTouristsCompletedFilters({
                            ...touristsCompletedFilters,
                            allRoutes: e.target.checked
                        })}
                        style={{ marginRight: '8px' }}
                    />
                    Все маршруты
                </label>
            </div>

            <div style={filterRowStyle}>
                <select
                    value={touristsCompletedFilters.section}
                    onChange={(e) => setTouristsCompletedFilters({...touristsCompletedFilters, section: e.target.value})}
                    style={selectStyle}
                    disabled={!touristsCompletedFilters.allRoutes}
                >
                    <option value="">Выберите секцию</option>
                    {sections.map(section => (
                        <option key={section} value={section}>{section}</option>
                    ))}
                </select>

                <select
                    value={touristsCompletedFilters.group}
                    onChange={(e) => setTouristsCompletedFilters({...touristsCompletedFilters, group: e.target.value})}
                    style={selectStyle}
                    disabled={!touristsCompletedFilters.allRoutes}
                >
                    <option value="">Выберите группу</option>
                    {groups.map(group => (
                        <option key={group} value={group}>{group}</option>
                    ))}
                </select>
            </div>

            {!touristsCompletedFilters.allRoutes && (
                <div style={filterRowStyle}>
                    <input
                        type="text"
                        value={touristsCompletedFilters.routeIds}
                        onChange={(e) => setTouristsCompletedFilters({...touristsCompletedFilters, routeIds: e.target.value})}
                        style={inputStyle}
                        placeholder="ID маршрутов через запятую"
                    />
                </div>
            )}

            <button onClick={handleTouristsCompletedSearch} style={buttonStyle}>
                Найти туристов
            </button>
        </div>
    );

    // Рендер результатов поиска
    const renderPersonsList = () => {
        if (isLoading && persons.length === 0) {
            return <div style={messageStyle}>Загрузка...</div>;
        }

        if (error) {
            return <div style={{ ...messageStyle, color: 'red' }}>{error}</div>;
        }

        if (persons.length === 0) {
            return <div style={messageStyle}>Ничего не найдено</div>;
        }

        return (
            <div style={listContainerStyle}>
                {persons.map(person => (
                    <button
                        key={person.id}
                        onClick={() => onPersonSelect(person)}
                        style={{
                            ...listItemStyle,
                            backgroundColor: selectedPerson?.id === person.id ? '#e0e0e0' : 'white',
                        }}
                    >
                        {`${person.surname} ${person.name} ${person.patronymic}`}
                    </button>
                ))}
            </div>
        );
    };

    const renderRouteIdsList = () => {
        if (isLoading && routeIds.length === 0) {
            return <div style={messageStyle}>Загрузка...</div>;
        }

        if (error) {
            return <div style={{ ...messageStyle, color: 'red' }}>{error}</div>;
        }

        if (routeIds.length === 0) {
            return <div style={messageStyle}>Маршруты не найдены</div>;
        }

        return (
            <div style={listContainerStyle}>
                {routeIds.map(routeId => (
                    <button
                        key={routeId}
                        onClick={() => onRouteSelect(routeId)}
                        style={{
                            ...listItemStyle,
                            backgroundColor: selectedRoute === routeId ? '#e0e0e0' : 'white',
                        }}
                    >
                        Маршрут {routeId}
                    </button>
                ))}
            </div>
        );
    };

    // Выбор текущего фильтра для рендера
    const renderCurrentFilter = () => {
        switch (mode) {
            case 'tourists-routes':
                return renderTouristsRoutesFilter();
            case 'routes-groups':
                return renderRoutesGroupsFilter();
            case 'routes-geo':
                return renderRoutesGeoFilter();
            case 'tourists-types':
                return renderTouristsTypesFilter();
            case 'instructors':
                return renderInstructorsFilter();
            case 'tourists-instructors':
                return renderTouristsInstructorsFilter();
            case 'tourists-completed':
                return renderTouristsCompletedFilter();
            default:
                return null;
        }
    };

    // Определяем, нужно ли рендерить список персон или маршрутов
    const shouldRenderPersonsList = ['tourists-routes', 'tourists-types', 'instructors', 'tourists-instructors', 'tourists-completed'].includes(mode);
    const shouldRenderRouteIdsList = ['routes-groups', 'routes-geo'].includes(mode);

    return (
        <div style={panelStyle}>
            <h2 style={{ margin: '0 0 20px 0' }}>Фильтры туров</h2>

            <div style={tabsContainerStyle}>
                <button
                    onClick={() => setMode('tourists-routes')}
                    style={{
                        ...tabButtonStyle,
                        backgroundColor: mode === 'tourists-routes' ? '#4CAF50' : '#f0f0f0',
                        color: mode === 'tourists-routes' ? 'white' : 'black',
                    }}
                >
                    Туристы-Маршруты
                </button>
                <button
                    onClick={() => setMode('routes-groups')}
                    style={{
                        ...tabButtonStyle,
                        backgroundColor: mode === 'routes-groups' ? '#4CAF50' : '#f0f0f0',
                        color: mode === 'routes-groups' ? 'white' : 'black',
                    }}
                >
                    Маршруты-Группы
                </button>
                <button
                    onClick={() => setMode('routes-geo')}
                    style={{
                        ...tabButtonStyle,
                        backgroundColor: mode === 'routes-geo' ? '#4CAF50' : '#f0f0f0',
                        color: mode === 'routes-geo' ? 'white' : 'black',
                    }}
                >
                    Маршруты-Гео
                </button>
                <button
                    onClick={() => setMode('tourists-types')}
                    style={{
                        ...tabButtonStyle,
                        backgroundColor: mode === 'tourists-types' ? '#4CAF50' : '#f0f0f0',
                        color: mode === 'tourists-types' ? 'white' : 'black',
                    }}
                >
                    Туристы-Типы
                </button>
                <button
                    onClick={() => setMode('instructors')}
                    style={{
                        ...tabButtonStyle,
                        backgroundColor: mode === 'instructors' ? '#4CAF50' : '#f0f0f0',
                        color: mode === 'instructors' ? 'white' : 'black',
                    }}
                >
                    Инструкторы
                </button>
                <button
                    onClick={() => setMode('tourists-instructors')}
                    style={{
                        ...tabButtonStyle,
                        backgroundColor: mode === 'tourists-instructors' ? '#4CAF50' : '#f0f0f0',
                        color: mode === 'tourists-instructors' ? 'white' : 'black',
                    }}
                >
                    Туристы-инструкторы
                </button>
                <button
                    onClick={() => setMode('tourists-completed')}
                    style={{
                        ...tabButtonStyle,
                        backgroundColor: mode === 'tourists-completed' ? '#4CAF50' : '#f0f0f0',
                        color: mode === 'tourists-completed' ? 'white' : 'black',
                    }}
                >
                    Выполненные маршруты
                </button>
            </div>

            {renderCurrentFilter()}

            {shouldRenderPersonsList && renderPersonsList()}
            {shouldRenderRouteIdsList && renderRouteIdsList()}
        </div>
    );
};

// Стили
const panelStyle: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '800px',
    margin: '0 auto'
};

const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '20px'
};

const tabButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap'
};

const filterContainerStyle: React.CSSProperties = {
    marginTop: '15px',
    padding: '15px',
    border: '1px solid #eee',
    borderRadius: '5px',
    backgroundColor: 'white'
};

const filterRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    flexWrap: 'wrap'
};

const selectStyle: React.CSSProperties = {
    padding: '8px',
    minWidth: '200px',
    borderRadius: '4px',
    border: '1px solid #ddd'
};

const inputStyle: React.CSSProperties = {
    padding: '8px',
    minWidth: '200px',
    borderRadius: '4px',
    border: '1px solid #ddd'
};

const buttonStyle: React.CSSProperties = {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
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