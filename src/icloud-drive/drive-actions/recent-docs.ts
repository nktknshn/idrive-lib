import { pipe } from "fp-ts/lib/function";
import * as SRTE from "fp-ts/lib/StateReaderTaskEither";
import { AuthenticatedState } from "../../icloud-core/icloud-request";
import { DepApiMethod, DriveApiMethods } from "../drive-api";
import * as Types from "../drive-types";

export type Deps = DepApiMethod<"recentDocs">;

export const recentDocs = <S extends AuthenticatedState>(
  { limit }: { limit: number },
): SRTE.StateReaderTaskEither<S, Deps, Error, Types.RecentDoc[]> => {
  return pipe(
    DriveApiMethods.recentDocs<S>({ limit }),
    // TODO add pagination support
    SRTE.map(({ continuationMarker: _continuationMarker, documents }) => documents),
  );
};
