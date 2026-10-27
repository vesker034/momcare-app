import { ArticleCategory, ChecklistCategory, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

import {
  buildCommonArticlesContent,
  buildUniqueWeekArticle,
} from './weekArticles';

const prisma = new PrismaClient();

interface WeekSeed {
  week: number;
  trimester: number;
  title: string;
  babySize: string;
  babyWeight: string;
  babyLength: string;
  fruitComparison: string;
  babyDevelopment: string;
  motherChanges: string;
  recommendation: string;
  symptoms: string;
  warnings: string;
}

interface ChecklistSeed {
  week: number;
  title: string;
  description: string;
  category: ChecklistCategory;
  sortOrder: number;
}

interface ArticleSeed {
  title: string;
  slug: string;
  category: ArticleCategory;
  summary: string;
  content: string;
  pregnancyWeek?: number;
  readingTimeMinutes: number | null;
}

const weeks: WeekSeed[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'info_of_weeks.json'), 'utf-8')
);

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') {
    return null;
  }

  return trimmed;
}

function toWeekContentData(week: WeekSeed) {
  return {
    week: week.week,
    trimester: week.trimester,
    title: week.title,
    babySize: emptyToNull(week.babySize),
    babyWeight: emptyToNull(week.babyWeight),
    babyLength: emptyToNull(week.babyLength),
    fruitComparison: emptyToNull(week.fruitComparison),
    babyDevelopment: week.babyDevelopment,
    motherChanges: week.motherChanges,
    recommendation: week.recommendation,
    symptoms: emptyToNull(week.symptoms),
    warnings: emptyToNull(week.warnings),
  };
}

const checklists: ChecklistSeed[] = [
  {
    week: 1,
    title: 'Сделать первый тест на беременность',
    description: 'При задержке менструации можно провести домашний тест и обсудить результат с врачом.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 1,
  },
  {
    week: 1,
    title: 'Записаться на первый приём к врачу',
    description: 'После положительного теста уточните у врача план первого визита и необходимых анализов.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 1,
    title: 'Начать отмечать первые симптомы',
    description: 'Усталость, чувствительность груди и изменения настроения полезно фиксировать в дневнике.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 3,
  },
  {
    week: 2,
    title: 'Обсудить с врачом приём витаминов',
    description: 'Уточните у врача, нужно ли принимать фолиевую кислоту и какие добавки подойдут.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 2,
    title: 'Исключить алкоголь и курение',
    description: 'Закрепите полезные привычки и обсудите с врачом любые принимаемые лекарства.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 2,
  },
  {
    week: 2,
    title: 'Продумать режим отдыха',
    description: 'Чередуйте работу и отдых, чтобы снизить усталость в первые недели.',
    category: ChecklistCategory.OTHER,
    sortOrder: 3,
  },
  {
    week: 3,
    title: 'Отслеживать базальную температуру',
    description: 'Если врач рекомендовал, ведите график, чтобы точнее определить срок.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 1,
  },
  {
    week: 3,
    title: 'Подготовить вопросы к первому визиту',
    description: 'Запишите вопросы о симптомах, тестах и плане наблюдения, чтобы не забыть.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 4,
    title: 'Подтвердить беременность у врача',
    description: 'Если тест положительный, запишитесь на приём и уточните дальнейшие шаги.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 4,
    title: 'Собрать документы для консультации',
    description: 'Паспорт, полис и предыдущие результаты анализов пригодятся на первом визите.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 2,
  },
  {
    week: 4,
    title: 'Вести дневник самочувствия',
    description: 'Фиксируйте настроение, сон и любые необычные ощущения.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 3,
  },
  {
    week: 5,
    title: 'Обсудить с врачом ранние симптомы',
    description: 'Тошноту, усталость и чувствительность к запахам поможет уменьшить дробный режим питания.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 5,
    title: 'Обсудить питание при тошноте',
    description: 'Уточните у врача, какие изменения режима питания могут подойти при тошноте.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 2,
  },
  {
    week: 5,
    title: 'Посчитать предварительный срок',
    description: 'От первого дня последних месячных можно ориентировочно посчитать срок беременности.',
    category: ChecklistCategory.OTHER,
    sortOrder: 3,
  },
  {
    week: 6,
    title: 'Уточнить у врача план обследований',
    description: 'Спросите, какие анализы и УЗИ рекомендованы в ближайшие недели.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 6,
    title: 'Организовать удобное рабочее место',
    description: 'Позаботьтесь о комфортном кресле и частых коротких перерывах.',
    category: ChecklistCategory.OTHER,
    sortOrder: 2,
  },
  {
    week: 7,
    title: 'Записать вопросы об анализах и УЗИ',
    description: 'Соберите вопросы, чтобы уточнить их на ближайшем приёме.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 7,
    title: 'Гулять на свежем воздухе',
    description: 'Спокойные прогулки помогают поддерживать тонус и улучшают сон.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 2,
  },
  {
    week: 8,
    title: 'Подготовить список принимаемых лекарств',
    description: 'Покажите врачу всё, что вы принимаете, чтобы он мог оценить безопасность.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 1,
  },
  {
    week: 8,
    title: 'Обсудить с врачом физическую активность',
    description: 'Уточните, какие нагрузки подходят именно вам, если вы занимались спортом.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 9,
    title: 'Проверить дату первого скрининга',
    description: 'Если врач назначил первый скрининг, уточните дату и подготовку к нему.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 9,
    title: 'Оформить карту в женской консультации',
    description: 'Соберите документы и уточните в регистратуре, что нужно для постановки на учёт.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 2,
  },
  {
    week: 10,
    title: 'Обсудить с врачом продукты с железом',
    description: 'Если врач рекомендовал, добавьте железосодержащие продукты и витамины.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 1,
  },
  {
    week: 10,
    title: 'Подготовить вопросы о скрининге',
    description: 'Запишите вопросы о первом скрининге, чтобы обсудить их с врачом.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 11,
    title: 'Пройти первый скрининг по назначению',
    description: 'Если врач рекомендовал УЗИ и анализы, сверьте с ним даты и подготовку.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 11,
    title: 'Обсудить с врачом прибавку веса',
    description: 'Спросите у врача ориентиры по весу и режиму питания на этом сроке.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 11,
    title: 'Вести учёт шевелений',
    description: 'Если врач просил отмечать шевеления, знакомьтесь с их характером.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 3,
  },
  {
    week: 12,
    title: 'Обсудить с врачом результаты скрининга',
    description: 'Расспросите о результатах УЗИ и анализов на ближайшем приёме.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 12,
    title: 'Выбрать удобную одежду',
    description: 'Подумайте о комфортном белье и одежде для растущего живота.',
    category: ChecklistCategory.OTHER,
    sortOrder: 2,
  },
  {
    week: 13,
    title: 'Обсудить с врачом питание во втором триместре',
    description: 'Уточните ориентиры по рациону, кальцию и питьевому режиму.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 13,
    title: 'Обсудить подходящую физическую активность',
    description: 'Уточните у врача, какие упражнения подходят на текущем сроке.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 2,
  },
  {
    week: 14,
    title: 'Записать дату следующего приёма',
    description: 'Убедитесь, что визит внесён в календарь.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 1,
  },
  {
    week: 14,
    title: 'Обсудить с врачом план второго триместра',
    description: 'Уточните график визитов и обследований на ближайшие недели.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 15,
    title: 'Пройти второй скрининг по назначению',
    description: 'Если врач рекомендовал, уточните дату и подготовку ко второму скринингу.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 15,
    title: 'Обратить внимание на осанку',
    description: 'Следите за осанкой при сидении и ходьбе, чтобы снизить нагрузку на спину.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 2,
  },
  {
    week: 16,
    title: 'Обсудить с врачом вопросы о шевелениях',
    description: 'Спросите, когда обычно появляются первые шевеления и что считать нормой.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 16,
    title: 'Записать дату второго скрининга',
    description: 'Если врач назначил обследования, внесите даты в календарь.',
    category: ChecklistCategory.OTHER,
    sortOrder: 2,
  },
  {
    week: 17,
    title: 'Продумать подготовку к декрету',
    description: 'Изучите документы и сроки оформления отпуска по беременности на работе.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 1,
  },
  {
    week: 17,
    title: 'Начать учёт движений малыша',
    description: 'Обычно к этому сроку движения становятся заметнее — можно отмечать их в дневнике.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 2,
  },
  {
    week: 18,
    title: 'Обсудить с врачом прибавку веса во втором триместре',
    description: 'Сверьте динамику веса с ориентирами, которые рекомендовал врач.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 18,
    title: 'Проверить список документов',
    description: 'Держите паспорт, полис и результаты анализов в одном удобном месте.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 2,
  },
  {
    week: 19,
    title: 'Обсудить с врачом план обследований',
    description: 'Уточните, какие обследования рекомендованы до конца триместра.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 19,
    title: 'Вести дневник активности малыша',
    description: 'Записывайте наблюдения, если врач просил следить за движениями.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 2,
  },
  {
    week: 20,
    title: 'Обновить дневник самочувствия',
    description: 'Отметьте сон, энергию, настроение и симптомы за неделю.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 1,
  },
  {
    week: 20,
    title: 'Начать собирать информацию о роддоме',
    description: 'Почитайте о роддомах и составьте список вопросов для будущих визитов.',
    category: ChecklistCategory.HOSPITAL_BAG,
    sortOrder: 2,
  },
  {
    week: 21,
    title: 'Подготовить документы для приёма',
    description: 'Проверьте, что нужные документы лежат в удобном месте.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 1,
  },
  {
    week: 21,
    title: 'Обсудить с врачом результаты обследований',
    description: 'Покажите врачу результаты анализов и обсудите, нужны ли дополнительные шаги.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 22,
    title: 'Пройти обследование по назначению',
    description: 'Если врач рекомендовал, уточните подготовку к обследованию и его сроки.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 22,
    title: 'Начать собирать вещи для малыша',
    description: 'Составьте черновой список необходимых вещей без срочных решений.',
    category: ChecklistCategory.BABY,
    sortOrder: 2,
  },
  {
    week: 23,
    title: 'Обсудить с врачом адаптацию к нагрузкам',
    description: 'Спросите о допустимой физической активности и признаках перенапряжения.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 23,
    title: 'Вести дневник шевелений',
    description: 'Обычно к этому сроку движения хорошо различимы — отмечайте их характер.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 2,
  },
  {
    week: 24,
    title: 'Записать вопросы к врачу',
    description: 'Соберите вопросы о самочувствии, анализах и плановых визитах.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 24,
    title: 'Проверить дату следующего приёма',
    description: 'Убедитесь, что визит внесён в календарь.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 2,
  },
  {
    week: 24,
    title: 'Обсудить с врачом тянущие ощущения',
    description: 'Если появляются тянущие ощущения, расскажите об этом врачу и уточните, когда обращаться.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 3,
  },
  {
    week: 25,
    title: 'Обновить дневник самочувствия',
    description: 'Отметьте сон, энергию, настроение и симптомы за неделю.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 1,
  },
  {
    week: 25,
    title: 'Подготовить документы для приёма',
    description: 'Проверьте, что нужные документы лежат в удобном месте.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 2,
  },
  {
    week: 25,
    title: 'Обсудить с врачом прибавку веса',
    description: 'Сверьте динамику веса с ориентирами, которые рекомендовал врач.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 3,
  },
  {
    week: 26,
    title: 'Составить список покупок для роддома',
    description: 'Пока достаточно черновика без срочных решений.',
    category: ChecklistCategory.HOSPITAL_BAG,
    sortOrder: 1,
  },
  {
    week: 26,
    title: 'Отметить активность малыша',
    description: 'Запишите наблюдения, если врач просил следить за движениями.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 2,
  },
  {
    week: 26,
    title: 'Обсудить с врачом подготовку к третьему триместру',
    description: 'Уточните график визитов и анализов на ближайшие недели.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 3,
  },
  {
    week: 27,
    title: 'Проверить список анализов',
    description: 'Сверьте с назначениями врача, какие анализы нужны перед визитом.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 1,
  },
  {
    week: 27,
    title: 'Добавить вопрос врачу',
    description: 'Запишите вопрос заранее, чтобы не забыть на приёме.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 27,
    title: 'Выбрать удобную позу для сна',
    description: 'Подушка под бок и между ног может сделать сон комфортнее.',
    category: ChecklistCategory.OTHER,
    sortOrder: 3,
  },
  {
    week: 28,
    title: 'Составить план родов',
    description: 'Продумайте общие предпочтения и обсудите их со специалистом на приёме.',
    category: ChecklistCategory.OTHER,
    sortOrder: 1,
  },
  {
    week: 28,
    title: 'Уточнить у врача план на третий триместр',
    description: 'Спросите о графике визитов и обследований до конца беременности.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 28,
    title: 'Следить за динамикой веса',
    description: 'Регулярно фиксируйте вес и обсуждайте изменения с врачом.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 3,
  },
  {
    week: 29,
    title: 'Проверить анализы перед приёмом',
    description: 'Сверьте список анализов с назначениями врача и их сроками действия.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 1,
  },
  {
    week: 29,
    title: 'Обсудить с врачом отёки и давление',
    description: 'Если появились отёки или поднимается давление, сообщите врачу.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 30,
    title: 'Начать подготавливать документы для роддома',
    description: 'Постепенно собирайте паспорт, полис, обменную карту и результаты анализов.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 1,
  },
  {
    week: 30,
    title: 'Обсудить с врачом план последних недель',
    description: 'Уточните, какие визиты и обследования запланированы до родов.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 30,
    title: 'Разобрать гардероб для выписки',
    description: 'Подберите удобную одежду для себя и первые вещи для малыша.',
    category: ChecklistCategory.BABY,
    sortOrder: 3,
  },
  {
    week: 31,
    title: 'Начать собирать сумку в роддом',
    description: 'Составьте список вещей и постепенно собирайте сумку без спешки.',
    category: ChecklistCategory.HOSPITAL_BAG,
    sortOrder: 1,
  },
  {
    week: 31,
    title: 'Обсудить с врачом признаки преждевременных родов',
    description: 'Уточните, на какие симптомы обращать внимание и когда обращаться к врачу.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 32,
    title: 'Проверить список вещей для малыша',
    description: 'Сверьте черновик списка нужных вещей с реальными потребностями.',
    category: ChecklistCategory.BABY,
    sortOrder: 1,
  },
  {
    week: 32,
    title: 'Записать даты всех оставшихся визитов',
    description: 'Убедитесь, что все приёмы и обследования внесены в календарь.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 2,
  },
  {
    week: 32,
    title: 'Обсудить с врачом наблюдение за шевелениями',
    description: 'Если врач рекомендовал регулярно следить за движениями, сверьте технику подсчёта.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 3,
  },
  {
    week: 33,
    title: 'Продолжить сбор сумки в роддом',
    description: 'Добавьте недостающие вещи: гигиенические принадлежности, одежду и зарядку.',
    category: ChecklistCategory.HOSPITAL_BAG,
    sortOrder: 1,
  },
  {
    week: 33,
    title: 'Уточнить у врача результаты обследований',
    description: 'Обсудите с врачом результаты УЗИ и анализов, если они были.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 34,
    title: 'Подготовить место для малыша',
    description: 'Позаботьтесь об удобном месте для сна и пеленания в домашних условиях.',
    category: ChecklistCategory.BABY,
    sortOrder: 1,
  },
  {
    week: 34,
    title: 'Обсудить с врачом план родов',
    description: 'Уточните детали родового плана и обсудите их на приёме.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 35,
    title: 'Проверить комплектность сумки в роддом',
    description: 'Сверьте сумку со списком и докупите недостающее.',
    category: ChecklistCategory.HOSPITAL_BAG,
    sortOrder: 1,
  },
  {
    week: 35,
    title: 'Уточнить у врача правила при затягивании родов',
    description: 'Спросите, когда нужно связаться с врачом или поехать в роддом.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 36,
    title: 'Подготовить документы для роддома',
    description: 'Соберите паспорт, полис, обменную карту и сертификат в одно удобное место.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 1,
  },
  {
    week: 36,
    title: 'Обсудить с врачом признаки начала родов',
    description: 'Уточните заранее, какие признаки говорят о начале родов и когда ехать в роддом.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 37,
    title: 'Финально проверить сумку в роддом',
    description: 'Готовую сумку лучше держать на видном месте вместе с документами.',
    category: ChecklistCategory.HOSPITAL_BAG,
    sortOrder: 1,
  },
  {
    week: 37,
    title: 'Составить список контактов',
    description: 'Подготовьте телефоны врача и роддома, чтобы они были под рукой.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 2,
  },
  {
    week: 38,
    title: 'Обсудить с врачом план родов и послеродовых дней',
    description: 'Уточните последние вопросы о родах и первых днях после них.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 1,
  },
  {
    week: 38,
    title: 'Подготовить маршрут до роддома',
    description: 'Проверьте маршрут и подумайте, кто сможет помочь с поездкой.',
    category: ChecklistCategory.OTHER,
    sortOrder: 2,
  },
  {
    week: 39,
    title: 'Следить за самочувствием',
    description: 'Отмечайте изменения и сообщайте врачу о беспокоящих симптомах.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 1,
  },
  {
    week: 39,
    title: 'Обсудить с врачом, когда обращаться за помощью',
    description: 'Уточните, в каких случаях нужно срочно связываться с врачом или ехать в роддом.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 40,
    title: 'Проверить сумку и документы ещё раз',
    description: 'Документы и сумка должны быть готовы к поездке в любой момент.',
    category: ChecklistCategory.HOSPITAL_BAG,
    sortOrder: 1,
  },
  {
    week: 40,
    title: 'Обсудить с врачом план на текущем сроке',
    description: 'Уточните, что делать при задержке родов и когда следующий визит.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 41,
    title: 'Наблюдать за шевелениями малыша',
    description: 'Продолжайте отмечать движения малыша и сообщайте об изменениях врачу.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 1,
  },
  {
    week: 41,
    title: 'Обсудить с врачом варианты при перенашивании',
    description: 'Уточните у врача план наблюдения, если беременность продлевается.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 42,
    title: 'Держать документы и сумку под рукой',
    description: 'Всё необходимое лучше держать в одном месте на случай поездки в роддом.',
    category: ChecklistCategory.HOSPITAL_BAG,
    sortOrder: 1,
  },
  {
    week: 42,
    title: 'Обсудить с врачом дальнейшие шаги',
    description: 'Уточните план наблюдения и возможные сценарии на текущем сроке.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 2,
  },
  {
    week: 11,
    title: 'Подготовиться к назначенному скринингу',
    description: 'Если врач назначил обследование, уточните подготовку и возьмите документы.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 4,
  },
  {
    week: 12,
    title: 'Записать вопросы к врачу после первого триместра',
    description: 'Соберите наблюдения о самочувствии и уточните план на второй триместр.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 4,
  },
  {
    week: 18,
    title: 'Подготовиться к УЗИ, если оно назначено',
    description: 'Уточните у врача дату, подготовку и какие документы взять с собой.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 4,
  },
  {
    week: 20,
    title: 'При желании уточнить, возможно ли определить пол ребёнка',
    description: 'Если это важно для вас, обсудите с врачом возможности и ограничения на текущем сроке.',
    category: ChecklistCategory.BABY,
    sortOrder: 4,
  },
  {
    week: 24,
    title: 'Подготовиться к глюкозотолерантному тесту, если его назначил врач',
    description: 'Уточните правила подготовки и время визита у специалиста.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 4,
  },
  {
    week: 28,
    title: 'Проверить даты следующих визитов',
    description: 'Сверьте календарь приёмов и при необходимости перенесите неудобное время заранее.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 4,
  },
  {
    week: 32,
    title: 'Обсудить с врачом план наблюдения на поздних сроках',
    description: 'Уточните частоту визитов и на какие изменения самочувствия обращать внимание.',
    category: ChecklistCategory.DOCTOR,
    sortOrder: 4,
  },
  {
    week: 34,
    title: 'Подготовить документы и вещи для роддома',
    description: 'Если врач уже рекомендовал собрать сумку, проверьте документы и список необходимого.',
    category: ChecklistCategory.HOSPITAL_BAG,
    sortOrder: 4,
  },
  {
    week: 36,
    title: 'Сдать назначенные анализы, если их назначил врач',
    description: 'Не добавляйте обследования самостоятельно — ориентируйтесь на назначения специалиста.',
    category: ChecklistCategory.HEALTH,
    sortOrder: 4,
  },
  {
    week: 38,
    title: 'Держать под рукой контакты врача и роддома',
    description: 'Проверьте, что важные номера и документы легко найти в нужный момент.',
    category: ChecklistCategory.DOCUMENTS,
    sortOrder: 4,
  },
];

const REMOVED_ARTICLE_SLUGS = [
  'prepare-for-doctor-visit',
  'wellbeing-diary-second-trimester',
  'weekly-checklist-basics',
] as const;

function buildWeekArticles(weekSeeds: WeekSeed[]): ArticleSeed[] {
  const categories: ArticleCategory[] = [
    ArticleCategory.PREGNANCY,
    ArticleCategory.NUTRITION,
    ArticleCategory.ACTIVITY,
    ArticleCategory.CHECKLISTS,
    ArticleCategory.DOCTOR,
  ];

  return weekSeeds.map((week) => {
    const category = categories[(week.week - 1) % categories.length];
    const built = buildUniqueWeekArticle(week, category);

    return {
      title: built.title,
      slug: `week-${week.week}-support-notes`,
      category,
      summary: built.summary,
      content: built.content,
      pregnancyWeek: week.week,
      readingTimeMinutes: null,
    };
  });
}

const articles: ArticleSeed[] = [
  ...buildWeekArticles(weeks),
  ...buildCommonArticlesContent(),
];

const seedWeeks = async (): Promise<void> => {
  for (const week of weeks) {
    const data = toWeekContentData(week);

    await prisma.pregnancyWeekContent.upsert({
      where: { week: week.week },
      update: data,
      create: data,
    });
  }
};

const seedChecklists = async (): Promise<void> => {
  for (const item of checklists) {
    const existingItem = await prisma.checklistItem.findFirst({
      where: {
        week: item.week,
        title: item.title,
        isDefault: true,
        ownerUserId: null,
      },
    });

    if (existingItem) {
      await prisma.checklistItem.update({
        where: { id: existingItem.id },
        data: {
          description: item.description,
          category: item.category,
          sortOrder: item.sortOrder,
          isDefault: true,
          ownerUserId: null,
        },
      });
      continue;
    }

    await prisma.checklistItem.create({
      data: {
        ...item,
        isDefault: true,
        ownerUserId: null,
      },
    });
  }
};

const seedArticles = async (): Promise<void> => {
  await prisma.article.deleteMany({
    where: {
      slug: {
        in: [...REMOVED_ARTICLE_SLUGS],
      },
    },
  });

  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        ...article,
        isPublished: true,
      },
      create: {
        ...article,
        isPublished: true,
      },
    });
  }
};

const main = async (): Promise<void> => {
  await seedWeeks();
  await seedChecklists();
  await seedArticles();
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
