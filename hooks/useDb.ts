import { useCallback } from "react";
import { useRealm, useQuery } from "../schemas";
import { Notifier } from "../schemas/NotifierSchema";
import { useUser } from "@realm/react";
import { BSON } from "realm";

export const useDb = () => {
  const realm = useRealm();
  const user = useUser();
  const ownNotifiersResults = useQuery<Notifier>(
    "Notifier",
    (collection) => collection.filtered("owner_id == $0", user.id),
    [user]
  );

  const createNotifier = useCallback(
    ({ stationId, threshold }: { stationId: string; threshold: number }) => {
      realm.write(() => {
        return new Notifier(realm, {
          threshold,
          stationId,
          owner_id: user?.id,
        });
      });
    },
    [realm, user]
  );

  const getNotifierById = useCallback(
    (id: BSON.ObjectId) => {
      return ownNotifiersResults.find((notifier) => notifier._id === id);
    },
    [ownNotifiersResults]
  );

  const editNotifier = useCallback(
    (
      notifier: Notifier,
      edits: Partial<Omit<Notifier, "_id" | "owner_id">>
    ) => {
      realm.write(() => {
        if (notifier.owner_id !== user?.id) {
          throw new Error("Cannot edit notifiers owned by other users");
        }
        Object.assign(notifier, edits);
      });
    },
    [realm]
  );

  const deleteNotifier = useCallback(
    (notifier: Notifier) => {
      realm.write(() => {
        realm.delete(notifier);
      });
    },
    [realm]
  );

  return {
    realm,
    user,
    ownNotifiersResults,
    getNotifierById,
    createNotifier,
    editNotifier,
    deleteNotifier,
  };
};
