---
project: MealAdapt
context_type: greenfield
created: 2026-10-07
updated: 2026-10-07
product_type: web-app
target_scale:
  users: small
  # TODO: qps — see Open Questions
  # TODO: data_volume — see Open Questions
timeline_budget:
  mvp_weeks: 3
  hard_deadline: 2026-11-04
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: Główny odbiorca
      decision: Osoba przygotowująca posiłek dla siebie, zgodnie z własnymi wykluczeniami.
    - topic: Główna trudność
      decision: Sprawdzenie wszystkich składników i znalezienie zamienników.
    - topic: Dostęp do aplikacji
      decision: Własne konto; samodzielna rejestracja i logowanie przez e-mail i hasło oraz odzyskiwanie hasła przez link e-mail. Logowanie przez Google odłożone poza MVP.
    - topic: Role i zakres dostępu
      decision: Jedna rola użytkownika, który widzi i zarządza tylko własnymi danymi.
    - topic: Akceptacja posiłku
      decision: Zaakceptowany posiłek trafia do własnej listy przepisów użytkownika, aby można było do niego wrócić.
    - topic: Odrzucenie zgodnej propozycji przez użytkownika
      decision: Jeden przycisk „Zaproponuj inny” odrzuca bieżącą propozycję i uruchamia nowe żądanie; bez osobnego kliknięcia „Odrzuć”.
    - topic: Plan czasowy MVP
      decision: Trzy tygodnie na główny przepływ wraz z logowaniem i zapisem przepisów przy około 8 godzinach tygodniowo; ostatni tydzień do 4 listopada na domknięcie projektu.
    - topic: Skala użytkowników
      decision: Pierwsza wersja dla twórcy i kilku osób. Przy stukrotnie większej liczbie użytkowników reguły wykluczeń i zamian pozostają takie same.
    - topic: Tryb pracy
      decision: Około 8 godzin tygodniowo, wyłącznie po godzinach.
    - topic: Dodatkowe wyłączenia zakresu
      decision: Bez działania offline, importu własnych przepisów z tekstu, linku lub pliku, wspólnych profili rodzinnych i udostępniania przepisów innym użytkownikom.
    - topic: Warunki niepodlegające naruszeniu
      decision: Posiłek z nierozwiązanym konfliktem nie może być przedstawiony jako zgodny z wykluczeniami; przepisy i wykluczenia są widoczne tylko dla właściciela.
    - topic: Nieznane składniki i granice generowania
      decision: Nierozpoznany składnik powoduje odrzucenie całego przepisu. Maksymalnie trzy propozycje na jedno żądanie, każda z najwyżej jedną rundą zamian i ponowną walidacją. Po trzech nieudanych propozycjach generowanie kończy się komunikatem o niepowodzeniu.
    - topic: Wybór zamiennika
      decision: Pierwszy dozwolony zamiennik z wcześniej uporządkowanej listy w katalogu; kolejność ustala twórca przy przygotowaniu katalogu.
    - topic: Przygotowanie katalogu
      decision: Mały katalog produktów, powiązań i uporządkowanych zamienników przygotowany i sprawdzony ręcznie przez twórcę, bez dodatkowej integracji ze źródłem danych.
    - topic: Początkowe wykluczenia
      decision: Początkowy zakres wykluczeń to mleko krowie, pszenica, orzechy włoskie i groch.
    - topic: Ilości i instrukcje po zamianie
      decision: Reguły zapisane w katalogu określają proporcję zamiany i potrzebne dostosowanie instrukcji; bez tych reguł zamiana nie jest dostępna.
    - topic: Zakres wykluczenia
      decision: Wykluczenie obejmuje wybrany produkt i pozycje jawnie powiązane w katalogu jako zawierające ten produkt; powiązania są ustalone wcześniej, a nie zgadywane przez AI.
    - topic: Jakość korzystania z aplikacji
      decision: Główny przepływ działa w przeglądarce na telefonie i komputerze; przy operacji trwającej ponad 2 sekundy użytkownik widzi informację o trwającym przetwarzaniu, a niepowodzenie kończy się czytelnym komunikatem.
    - topic: Dodatkowe cele MVP
      decision: Bez dodatkowych celów na tym etapie; skupienie na ustalonym głównym przepływie.
    - topic: Zarządzanie wykluczeniami
      decision: Użytkownik wybiera produkty z ustalonego katalogu; może przeglądać, dodawać i usuwać wykluczenia także po pierwszym ustawieniu. Brakującego produktu nie można dopisać samodzielnie; aplikacja informuje, że nie obsługuje i nie uwzględni tego ograniczenia.
    - topic: Własna lista przepisów
      decision: Zapis zaakceptowanych przepisów i przeglądanie, bez edycji i usuwania. Ponowne zapisanie tej samej propozycji nie tworzy duplikatu. Przy otwarciu zapisany przepis jest sprawdzany względem aktualnych wykluczeń; konflikt powoduje ostrzeżenie, bez zmiany lub usunięcia przepisu.
  frs_drafted: 8
  quality_check_status: accepted
---

## Vision & Problem Statement

Osoba ze znanymi alergiami pokarmowymi lub świadomymi wykluczeniami żywieniowymi podczas codziennego planowania posiłku dla siebie musi samodzielnie sprawdzać wszystkie składniki przepisu i szukać zamienników. Zajmuje to czas i może prowadzić do rezygnacji z danego posiłku. Największe trudności wskazane przez użytkownika to sprawdzenie wszystkich składników i znalezienie zamienników.

MealAdapt ma proponować posiłki na podstawie ograniczeń podanych przez użytkownika, wykrywać konflikty i dostosowywać składniki, a gdy zamiana nie jest możliwa — proponować inny posiłek. Sprawdzanie ograniczeń nie ma polegać wyłącznie na odpowiedzi modelu AI. Pierwsza wersja jest przeznaczona dla twórcy i kilku osób; przy stukrotnie większej liczbie użytkowników reguły wykluczeń i zamian pozostają takie same.

## User & Persona

Główny odbiorca: osoba przygotowująca posiłek dla siebie, która zna swoje alergie pokarmowe lub świadomie wyklucza określone produkty. Sięga po aplikację podczas codziennego planowania jedzenia i szukania przepisu dopasowanego do własnych ograniczeń.

## Success Criteria

### Primary
- Użytkownik ustawia własne wykluczenia i generuje pojedynczy posiłek. Składniki są sprawdzane; w razie konfliktu następuje próba zastosowania dozwolonego zamiennika i ponowna walidacja całego posiłku. Nierozpoznany składnik, niemożliwa zamiana lub nieudana ponowna walidacja powodują odrzucenie przepisu. W jednym żądaniu powstają najwyżej trzy propozycje, każda z najwyżej jedną rundą zamian i ponowną walidacją. Po trzech nieudanych propozycjach aplikacja kończy generowanie komunikatem o niepowodzeniu. Użytkownik może zaakceptować zgodny posiłek, zapisać go na własnej liście przepisów i później do niego wrócić.
- Użytkownik może jednym kliknięciem „Zaproponuj inny” odrzucić bieżącą zgodną propozycję i uruchomić nowe żądanie, bez osobnego kliknięcia „Odrzuć”.

### Secondary
- Świadomie nie ustalono dodatkowych celów na tym etapie; priorytetem jest działający główny przepływ MVP.

### Guardrails
- Posiłek z nierozwiązanym konfliktem nie może zostać przedstawiony jako zgodny z wykluczeniami.
- Przepisy i wykluczenia są widoczne tylko dla właściciela.

## User Stories

### US-01: Dostosowanie i zapis przepisu na śniadanie

- **Given** użytkownik ma wykluczone mleko krowie.
- **When** prosi o propozycję śniadania, a proponowany przepis na naleśniki zawiera mleko krowie.
- **Then** aplikacja wykrywa konflikt, zastępuje mleko odpowiednim dozwolonym zamiennikiem z katalogu i ponownie weryfikuje cały przepis; użytkownik akceptuje zmodyfikowany przepis i zapisuje go na własnej liście, aby później do niego wrócić.

#### Acceptance Criteria
- Mleko krowie w propozycji zostaje rozpoznane jako konflikt z wykluczeniem użytkownika.
- W tym scenariuszu istnieje odpowiedni, dozwolony zamiennik z katalogu i zastępuje on mleko krowie.
- Ilość zamiennika i potrzebne zmiany instrukcji wynikają z reguł katalogu; zamiana bez takich reguł jest niedostępna.
- Po zamianie sprawdzany jest cały przepis względem wykluczeń użytkownika.
- Przepis z nierozwiązanym konfliktem nie jest przedstawiany jako zgodny.
- Po akceptacji zmodyfikowany przepis trafia na własną listę użytkownika i można go później przeglądać.

## Functional Requirements

### Konto
- FR-001: Użytkownik może samodzielnie zarejestrować konto, logować się przez e-mail i hasło oraz ustawić nowe hasło za pomocą linku odzyskiwania wysłanego na e-mail. Priority: must-have
  > Socratic: Rozważono utratę dostępu do zapisanych przepisów po zapomnieniu hasła. Rozwiązanie: użytkownik wybrał odzyskiwanie hasła przez link e-mail pozwalający ustawić nowe hasło.
- FR-002: Użytkownik może logować się przez Google. Priority: nice-to-have
  > Socratic: Rozważono dodatkowy koszt integracji drugiej metody logowania. Rozwiązanie: użytkownik odłożył logowanie przez Google poza MVP.

### Wykluczenia i propozycje posiłków
- FR-003: Użytkownik może przeglądać własne wykluczenia, dodawać produkty wybrane z ustalonego katalogu i usuwać wykluczenia także po pierwszym ustawieniu; przy braku produktu otrzymuje informację, że ograniczenie nie jest obsługiwane i nie zostanie uwzględnione, bez możliwości dopisania własnej nazwy. Priority: must-have
  > Socratic: Rozważono brak możliwości zapisania ograniczenia, którego nie ma w katalogu. Rozwiązanie: użytkownik wybrał jawną informację o nieobsługiwanym ograniczeniu, bez dopisywania własnej nazwy i bez funkcji zgłaszania brakujących produktów w MVP.
- FR-004: Użytkownik może poprosić o propozycję pojedynczego posiłku, np. śniadania, na podstawie własnych wykluczeń. Priority: must-have
  > Socratic: Rozważono, że zgodność z wykluczeniami nie wystarczy, gdy propozycja nie odpowiada wskazanemu rodzajowi posiłku. Użytkownik pozostawia wymaganie bez zmian (odpowiedź C).
- FR-005: Użytkownik może otrzymać posiłek sprawdzony względem wykluczeń, z najwyżej jedną rundą zamian na wcześniej zdefiniowane dozwolone zamienniki według proporcji i reguł dostosowania instrukcji zapisanych w katalogu oraz ponowną walidacją całego przepisu; nierozpoznany składnik lub nierozwiązany konflikt powoduje odrzucenie przepisu, a po najwyżej trzech nieudanych propozycjach w jednym żądaniu użytkownik otrzymuje komunikat o niepowodzeniu. Priority: must-have
  > Socratic: Rozważono nieznany składnik oraz kolejne nieskuteczne zamiany uniemożliwiające zakończenie generowania. Rozwiązanie: nierozpoznany składnik odrzuca cały przepis; limit to pierwsza propozycja i najwyżej dwie kolejne po nieudanej walidacji, każda z najwyżej jedną rundą zamian i ponownym sprawdzeniem. Po trzech nieudanych propozycjach następuje komunikat o niepowodzeniu i zakończenie prób.
- FR-006: Użytkownik może jednym kliknięciem „Zaproponuj inny” odrzucić bieżącą zgodną propozycję i uruchomić nowe żądanie generowania, bez osobnego kliknięcia „Odrzuć”. Priority: must-have
  > Socratic: Rozważono zbędne dwa kliknięcia przy osobnym odrzucaniu i ponawianiu. Rozwiązanie: jedno kliknięcie „Zaproponuj inny” odrzuca bieżącą propozycję i uruchamia nowe żądanie.

### Własna lista przepisów
- FR-007: Użytkownik może zaakceptować propozycję posiłku i zapisać ją na własnej liście przepisów; ponowne zapisanie tej samej wygenerowanej propozycji nie tworzy kolejnego wpisu. Priority: must-have
  > Socratic: Rozważono duplikaty powstające przy wielokrotnej akceptacji tego samego przepisu. Rozwiązanie: ta sama wygenerowana propozycja jest zapisywana tylko raz; MVP nie porównuje podobieństwa osobno wygenerowanych przepisów.
- FR-008: Użytkownik może przeglądać własne zapisane przepisy; przy otwarciu przepis jest sprawdzany względem aktualnych wykluczeń, a wykryty konflikt powoduje ostrzeżenie bez automatycznych zamian ani usuwania przepisu. Priority: must-have
  > Socratic: Rozważono konflikt zapisanego przepisu z później zmienionymi wykluczeniami. Rozwiązanie: ponowne sprawdzenie przy otwarciu i ostrzeżenie o konflikcie; przepis zostaje zachowany bez automatycznej zmiany.

## Non-Functional Requirements

- Cały główny przepływ jest dostępny w przeglądarce zarówno na telefonie, jak i komputerze.
- Podczas operacji trwającej ponad 2 sekundy użytkownik otrzymuje widoczną informację o trwającym przetwarzaniu.
- Niepowodzenie operacji kończy się czytelnym dla użytkownika komunikatem.
- Przepisy i wykluczenia użytkownika są widoczne tylko dla właściciela konta.

## Business Logic

Posiłek może zostać przedstawiony jako zgodny z wykluczeniami użytkownika tylko wtedy, gdy cały przepis przejdzie walidację po ewentualnych zamianach niedozwolonych składników.

Wejściem są wykluczenia wskazane przez użytkownika z ustalonego katalogu oraz składniki proponowanego przepisu. Początkowy zakres wykluczeń to mleko krowie, pszenica, orzechy włoskie i groch. Mały katalog produktów, powiązań i uporządkowanych zamienników przygotowuje i sprawdza ręcznie twórca; jego pełna zawartość powstanie później, bez dodatkowej integracji ze źródłem danych. Wykluczenie obejmuje wskazany produkt oraz pozycje jawnie powiązane w katalogu jako zawierające ten produkt; powiązania są ustalone wcześniej. Nierozpoznany składnik powoduje odrzucenie całego przepisu. Dla składnika konfliktowego wybierany jest pierwszy dozwolony zamiennik z wcześniej uporządkowanej listy w katalogu, uwzględniający ten sam zakres wykluczeń. Kolejność ustala twórca przy przygotowaniu katalogu. Dostępna zamiana musi mieć w katalogu określoną proporcję oraz regułę potrzebnego dostosowania instrukcji; bez tych reguł zamiana nie jest dostępna. Ilości i instrukcje są dostosowywane według tych reguł. Po jednej rundzie zamian ponownie sprawdzany jest cały przepis; nierozwiązany konflikt powoduje jego odrzucenie.

Jedno żądanie obejmuje najwyżej trzy propozycje: pierwszą i najwyżej dwie kolejne po nieudanej walidacji. Każda ma najwyżej jedną rundę zamian i ponowną walidację. Wynikiem jest zgodna propozycja albo, po trzech nieudanych propozycjach, komunikat o niepowodzeniu i zakończenie prób. Zgodną propozycję można zaakceptować i zapisać albo jednym kliknięciem „Zaproponuj inny” odrzucić i uruchomić nowe żądanie.

Ponowne zapisanie tej samej wygenerowanej propozycji nie tworzy duplikatu; osobno wygenerowane przepisy nie są porównywane pod względem podobieństwa. Przy otwarciu zapisanego przepisu sprawdzana jest zgodność z aktualnymi wykluczeniami. Konflikt powoduje ostrzeżenie, a przepis pozostaje zachowany bez automatycznej zmiany.

## Access Control

Użytkownik ma własne konto. Może samodzielnie zarejestrować się i logować przez e-mail i hasło. W razie zapomnienia hasła może ustawić nowe za pomocą linku odzyskiwania wysłanego na e-mail. Wykluczenia są przypisane do jego konta i dostępne na różnych urządzeniach. Logowanie przez Google jest poza MVP.

W MVP istnieje jedna rola użytkownika, który widzi i zarządza tylko własnymi danymi. Dodatkowa rola administratora nie jest potrzebna.

## Non-Goals

- Działanie bez internetu — korzystanie z aplikacji w MVP wymaga połączenia.
- Import własnych przepisów z tekstu, linku lub pliku — MVP operuje wyłącznie na propozycjach generowanych w aplikacji.
- Wspólne profile rodzinne i udostępnianie przepisów innym użytkownikom — każdy korzysta z własnego konta i listy.
- Tygodniowe jadłospisy i rozbudowany planer dietetyczny — MVP skupia się na pojedynczym posiłku.
- Diagnozowanie alergii i ustalanie, czego użytkownik powinien unikać — użytkownik sam podaje znane ograniczenia.
- Porady medyczne, diety lecznicze i suplementacja — aplikacja ma pomagać w planowaniu posiłków na podstawie podanych wykluczeń.
- Integracje ze sklepami i automatyczne zakupy — poza zakresem pierwszej wersji.
- Zaawansowane liczenie kalorii i makroskładników — pierwsza wersja skupia się na zgodności posiłku z wykluczeniami.
- Porównywanie podobieństwa osobno wygenerowanych przepisów — zapobieganie duplikatom dotyczy wyłącznie ponownego zapisu tej samej propozycji.
- Dopisywanie własnych nazw wykluczeń i zgłaszanie brakujących produktów — MVP obsługuje ustalony katalog i jawnie informuje o ograniczeniach jego zakresu.
- Logowanie przez Google — odłożone poza MVP, aby ograniczyć zakres integracji; w MVP pozostaje e-mail i hasło z odzyskiwaniem dostępu.
- Edycja i usuwanie zapisanych przepisów — użytkownik uznał przeglądanie za wystarczający zakres MVP poza zapisywaniem zaakceptowanych propozycji.

## Open Questions

1. **Jakie są przewidywane obciążenie i wolumen danych (target_scale.qps oraz target_scale.data_volume)?** — Ustalono pierwszą wersję dla twórcy i kilku osób, bez szacunków częstotliwości generowania i liczby zapisanych przepisów. Do rozstrzygnięcia przez użytkownika podczas dalszego planowania; data nieustalona.

## Quality cross-check

- Access Control: present — własne konto, jedna rola i dostęp tylko do własnych danych.
- Business Logic: present — jednozdaniowa reguła, kontrolowane wykluczenia i zamiany, limity prób; doprecyzowano zakres katalogu oraz reguły ilości i instrukcji.
- Project artifacts: present — shape-notes.md z checkpointem i wszystkimi dziesięcioma sekcjami w kolejności schematu.
- Timeline-cost acknowledgment: present — trzy tygodnie na MVP, około 8 godzin tygodniowo po godzinach.
- Non-Goals: present — zapisane wyłączenia funkcjonalne i brak działania offline.
- Preserved behavior: n/a — greenfield.
- Brak brakujących elementów końcowej kontroli. Szacunki obciążenia i wolumenu danych pozostają otwartym pytaniem do dalszego planowania. Użytkownik zaakceptował wynik i zakończenie sesji; quality_check_status: accepted.

## Discovery progress

Sesja zakończona i zaakceptowana przez użytkownika. Etapy 1–7 ukończone; checkpoint 8 oznacza gotowość do /10x-prd. Zapisano osiem wymagań (siedem must-have i jedno nice-to-have poza MVP), scenariusz US-01 oraz odpowiedzi na wszystkie kontrargumenty. Pozostawiono jawne otwarte pytanie o szacunki obciążenia i wolumenu danych. Nie uruchomiono generowania PRD.

## Seed idea

Chcę stworzyć od zera aplikację webową MealAdapt dla osób, które mają znane alergie pokarmowe lub świadomie wykluczają określone produkty z diety.

Problem pojawia się podczas codziennego planowania posiłków i szukania przepisów. Osoba z alergią musi samodzielnie sprawdzać składniki każdego przepisu, wykrywać produkty, których nie może spożywać, a następnie szukać odpowiednich zamienników albo całkowicie rezygnować z danego posiłku. Jest to czasochłonne i utrudnia szybkie planowanie jedzenia.

Chcę, aby użytkownik mógł podać swoje alergie lub produkty wykluczone, a aplikacja proponowała mu posiłki dopasowane do tych ograniczeń.

Jeśli proponowany posiłek zawiera składnik znajdujący się na liście wykluczeń użytkownika, aplikacja powinna wykryć konflikt i spróbować dostosować posiłek poprzez zastąpienie problematycznego składnika odpowiednim zamiennikiem. Jeśli nie da się znaleźć odpowiedniego zamiennika, aplikacja powinna zaproponować inny posiłek zamiast ignorować ograniczenie.

Chciałbym wykorzystać AI do generowania i dostosowywania propozycji posiłków, ale aplikacja nie powinna polegać wyłącznie na odpowiedzi modelu przy sprawdzaniu ograniczeń użytkownika.

Aplikacja nie ma diagnozować alergii ani określać, czego użytkownik powinien unikać. Użytkownik sam podaje swoje znane ograniczenia, a aplikacja ma pomagać mu w planowaniu posiłków na ich podstawie.

Na początku chcę skupić się na możliwie małym MVP i jednym działającym przepływie, zamiast od razu budować rozbudowany planer dietetyczny.
