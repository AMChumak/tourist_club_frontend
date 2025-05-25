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


type PageType = 'persons' | 'championships';

// Основной компонент
const App: React.FC = () => {
    const [activeRequests, setActiveRequests] = useState<CancelableRequest[]>([]);
    const [currentPage, setCurrentPage] = useState<PageType>('persons');
    const [searchTerm, setSearchTerm] = useState('');
    const [persons, setPersons] = useState<PersonShort[]>([]);
    const [championships, setChampionships] = useState<Championship[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<PersonShort | null>(null);
    const [selectedSection, setSelectedSection] = useState<string>("1");
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