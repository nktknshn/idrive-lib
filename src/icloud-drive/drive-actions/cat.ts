import { pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as SRTE from "fp-ts/lib/StateReaderTaskEither";
import * as O from "fp-ts/Option";

import { DepFetchClient } from "../../deps-types";
import { err } from "../../util/errors";
import { getUrlStream } from "../../util/http/getUrlStream";
import { normalizePath } from "../../util/normalize-path";
import { consumeStreamToString } from "../../util/util";
import { DriveLookup, Types } from "..";
import { DepApiMethod, DriveApiMethods } from "../drive-api";
import { isFile } from "../drive-types";

export type Deps =
  & DriveLookup.Deps
  & DepApiMethod<"download">
  & DepFetchClient;

export const cat = (
  { path }: { path: string },
): DriveLookup.Lookup<string, Deps> => {
  const npath = pipe(path, normalizePath);

  const handleFile = (item: Types.DriveChildrenItemFile) =>
    pipe(
      DriveApiMethods.getDriveItemUrl<DriveLookup.State>(item),
      SRTE.chainOptionK(() => err(`cannot get url`))(O.fromNullable),
      SRTE.chainW((url) =>
        SRTE.fromReaderTaskEither(
          pipe(
            getUrlStream({ url }),
            RTE.chainTaskEitherK(consumeStreamToString),
          ),
        )
      ),
    );

  return pipe(
    DriveLookup.getByPathStrictDocwsroot(npath),
    SRTE.filterOrElse(isFile, () => err(`you cannot cat a directory`)),
    SRTE.chainW((item) =>
      item.size === 0
        ? SRTE.of("")
        : handleFile(item)
    ),
  );
};
