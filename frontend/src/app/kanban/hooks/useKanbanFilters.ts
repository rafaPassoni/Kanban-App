import { useMemo, useState } from "react";
import type { Task } from "../types";

export function useKanbanFilters(tasks: Task[]) {
    const [filterProject, setFilterProject] = useState<string>("all");
    const [filterAssignedTo, setFilterAssignedTo] = useState<string>("all");
    const [filterDepartment, setFilterDepartment] = useState<string>("all");

    const filteredTasks = useMemo(() => tasks.filter((task) => {
        const matchProject = filterProject === "all" || task.project === Number(filterProject);
        const matchAssigned =
            filterAssignedTo === "all"
            || task.responsavel === Number(filterAssignedTo)
            || (task.assigned_to || []).includes(Number(filterAssignedTo));
        const matchDept =
            filterDepartment === "all" || (task.department || []).includes(Number(filterDepartment));
        return matchProject && matchAssigned && matchDept;
    }), [tasks, filterProject, filterAssignedTo, filterDepartment]);

    return {
        filterProject, setFilterProject,
        filterAssignedTo, setFilterAssignedTo,
        filterDepartment, setFilterDepartment,
        filteredTasks,
    };
}
