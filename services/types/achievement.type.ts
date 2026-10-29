export interface Achievement {
  id: string;
  /** Подпись счётчика: «книг», «игр», «лет» */
  label: string;
  /** Значение как строка: «1200», «12 000+» */
  count: string;
  isDeleted: boolean;
  createdAt: string;
}
