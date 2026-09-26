/**
 * TypeScript mirror of protocol/v1/schema.json.
 * Plan to keep these in sync for now; generated bindings (this file, plus
 * eventual Java/C++ ones) are deferred until a second worker language needs one.
 */

export interface Envelope {
  protocolVersion: 1;
  runId: string;
  type: string;
}

export interface RunCommand extends Envelope {
  type: 'run';
  adapter: string;
  [adapterField: string]: unknown;
}

export interface NodeRunCommand extends RunCommand {
  adapter: 'node';
  entryPoint: string;
}

export interface CancelCommand extends Envelope {
  type: 'cancel';
}

export type Command = RunCommand | CancelCommand;

export interface ReadyEvent extends Envelope {
  type: 'ready';
}

export interface RunStartedEvent extends Envelope {
  type: 'run.started';
}

export interface SuiteDiscoveredEvent extends Envelope {
  type: 'suite.discovered';
  suite: { id: string; name: string };
  tests: Array<{ id: string; name: string }>;
}

export interface TestStartedEvent extends Envelope {
  type: 'test.started';
  testId: string;
}

export interface TestStdoutEvent extends Envelope {
  type: 'test.stdout';
  testId: string;
  chunk: string;
}

export interface TestStderrEvent extends Envelope {
  type: 'test.stderr';
  testId: string;
  chunk: string;
}

export interface TestFinishedEvent extends Envelope {
  type: 'test.finished';
  testId: string;
  status: 'passed' | 'failed' | 'errored';
  durationMs: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface RunCompletedEvent extends Envelope {
  type: 'run.completed';
}

export interface RunFailedEvent extends Envelope {
  type: 'run.failed';
  reason: string;
}

export interface RunAbortedEvent extends Envelope {
  type: 'run.aborted';
}

export type Event =
  | ReadyEvent
  | RunStartedEvent
  | SuiteDiscoveredEvent
  | TestStartedEvent
  | TestStdoutEvent
  | TestStderrEvent
  | TestFinishedEvent
  | RunCompletedEvent
  | RunFailedEvent
  | RunAbortedEvent;

export type Message = Command | Event;
