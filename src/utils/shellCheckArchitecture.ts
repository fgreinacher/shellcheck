import process from 'node:process';
import { config } from '~/configs';
import { ArchitectureError } from '~/errors';

/**
 * ShellCheck Architecture arguments.
 */
export type ShellCheckArchitectureArgs = {
  /**
   * Architecture.
   */
  architecture?: NodeJS.Architecture;
  /**
   * Platform.
   */
  platform?: NodeJS.Platform;
};

/**
 * Convert architecture to ShellCheck architecture.
 *
 * @param args - Arguments.
 * @returns ShellCheck architecture.
 */
export function shellCheckArchitecture(args?: ShellCheckArchitectureArgs) {
  const opts: Required<ShellCheckArchitectureArgs> = {
    architecture: args?.architecture ?? process.arch,
    platform: args?.platform ?? process.platform
  };

  const architecture = config.binaries[opts.platform]?.architectures.find(
    (arch) => arch[0] === opts.architecture
  )?.[1];

  if (architecture === undefined) throw new ArchitectureError();
  return architecture;
}
