import { useSyncExternalStore } from "react";

export interface Person {
  id: number;
  name: string;
  surname: string;
  city: string;
  age: number;
  avatar: string;
  online: boolean;
  status?: string;
  mutualFriends?: string[];
}

export interface FriendRequest {
  id: number;
  person: Person;
  time: string;
}

interface FriendsState {
  friends: Person[];
  incomingRequests: FriendRequest[];
  outgoingIds: number[];
}

const initialFriends: Person[] = [
  { id: 2, name: "Ислам", surname: "Дудаев", city: "Гудермес", age: 28, avatar: "И", online: true, status: "Работаю 💼", mutualFriends: ["Зайнаб", "Ахмед"] },
  { id: 4, name: "Руслан", surname: "Арсанов", city: "Шали", age: 31, avatar: "Р", online: false, status: "", mutualFriends: ["Ислам", "Малика"] },
  { id: 9, name: "Зарема", surname: "Тагаева", city: "Назрань", age: 26, avatar: "З", online: true, status: "Дома 🏠", mutualFriends: ["Хеда"] },
];

let state: FriendsState = {
  friends: initialFriends,
  incomingRequests: [
    { id: 101, person: { id: 5, name: "Хеда", surname: "Гайтаева", city: "Аргун", age: 19, avatar: "Х", online: true, status: "Алхамдулиллах 🙏", mutualFriends: ["Зайнаб"] }, time: "12:00" },
  ],
  outgoingIds: [],
};

const listeners = new Set<() => void>();

function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

export const friendsStore = {
  // Отправить запрос в друзья (исходящий)
  sendRequest(person: Person) {
    if (state.outgoingIds.includes(person.id)) return;
    if (state.friends.some((f) => f.id === person.id)) return;
    state.outgoingIds = [...state.outgoingIds, person.id];
    emit();
  },
  // Отменить исходящий запрос
  cancelRequest(personId: number) {
    state.outgoingIds = state.outgoingIds.filter((id) => id !== personId);
    emit();
  },
  // Принять входящий запрос — человек становится другом
  acceptRequest(reqId: number) {
    const req = state.incomingRequests.find((r) => r.id === reqId);
    if (!req) return;
    state.incomingRequests = state.incomingRequests.filter((r) => r.id !== reqId);
    if (!state.friends.some((f) => f.id === req.person.id)) {
      state.friends = [...state.friends, req.person];
    }
    emit();
  },
  // Отклонить входящий запрос
  declineRequest(reqId: number) {
    state.incomingRequests = state.incomingRequests.filter((r) => r.id !== reqId);
    emit();
  },
  // Удалить из друзей
  removeFriend(personId: number) {
    state.friends = state.friends.filter((f) => f.id !== personId);
    state.outgoingIds = state.outgoingIds.filter((id) => id !== personId);
    emit();
  },
  // Симуляция: входящий запрос (демо)
  addIncomingRequest(person: Person) {
    const reqId = Date.now();
    state.incomingRequests = [{ id: reqId, person, time: "сейчас" }, ...state.incomingRequests];
    emit();
  },
  isFriend(personId: number) {
    return state.friends.some((f) => f.id === personId);
  },
  isPending(personId: number) {
    return state.outgoingIds.includes(personId);
  },
};

export function useFriends() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    friends: snap.friends,
    incomingRequests: snap.incomingRequests,
    outgoingIds: snap.outgoingIds,
    ...friendsStore,
  };
}
